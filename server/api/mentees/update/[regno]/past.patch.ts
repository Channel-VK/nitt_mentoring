import { Client } from "../../../../utils/database.js";
import { getTokenFromEvent } from "../../../../utils/auth.js";
import { verifyJwt } from "../../../../utils/jwt.js";

const client = new Client();
export default defineEventHandler(async (e) => {
  const token = getTokenFromEvent(e);
  if (!token) {
    throw createError({
      statusCode: 401,
      statusText: "Not logged in.",
    });
  }

  const jwtPayload = await verifyJwt(token);
  if (!jwtPayload || (Date.now() / 1000) > jwtPayload.exp) {
    throw createError({
      statusCode: 401,
      statusText: "Session expired. Please login again.",
    });
  }

  if (Number(jwtPayload.level) < 1) {
    throw createError({
      statusCode: 403,
      statusText: "You do not have permission.",
    });
  }

  const regno = getRouterParam(e, "regno");
  if (!regno) {
    throw createError({
      statusCode: 400,
      statusText: "Registration number is required.",
    });
  }

  const body = await readBody<{
    past?: {
      sslc?: {
        institution?: string;
        board_of_study?: string;
        year_of_study?: string;
        percentage?: string;
      };
      hsc?: {
        institution?: string;
        board_of_study?: string;
        year_of_study?: string;
        percentage?: string;
      };
      jee?: {
        rank?: number | null;
        score?: number | null;
      };
      pg_feilds?: {
        ug_cgpa?: number | null;
        gate_score?: number | null;
        work_experience?: string;
      };
    };
  }>(e);

  const past = body?.past;
  const jeeScore = past?.jee?.score;
  const jeeRank = past?.jee?.rank;
  const ugCgpa = past?.pg_feilds?.ug_cgpa;
  const gateScore = past?.pg_feilds?.gate_score;

  try {
    await client.prisma.students.update({
      where: { register_no: regno },
      data: {
        sslc_institution: past?.sslc?.institution,
        sslc_board: past?.sslc?.board_of_study,
        sslc_years: past?.sslc?.year_of_study,
        sslc_percentage: past?.sslc?.percentage,

        hsc_institution: past?.hsc?.institution,
        hsc_board: past?.hsc?.board_of_study,
        hsc_years: past?.hsc?.year_of_study,
        hsc_percentage: past?.hsc?.percentage,

        jee_score: jeeScore !== undefined && jeeScore !== null && !isNaN(Number(jeeScore)) ? Number(jeeScore) : null,
        jee_rank: jeeRank !== undefined && jeeRank !== null && !isNaN(Number(jeeRank)) ? Number(jeeRank) : null,

        ug_cgpa: ugCgpa !== undefined && ugCgpa !== null && !isNaN(Number(ugCgpa)) ? Number(ugCgpa) : null,
        gate_score: gateScore !== undefined && gateScore !== null && !isNaN(Number(gateScore)) ? Number(gateScore) : null,
        work_experience: past?.pg_feilds?.work_experience ?? null,
      },
    });

    return {
      message: "Academic qualifications updated successfully.",
    };
  } catch (error: any) {
    console.error("Error updating academic qualifications:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusText: "Failed to update academic qualifications.",
    });
  }
});
