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
    ug_cgpa?: number | null;
    gate_score?: number | null;
    work_experience?: string | null;
  }>(e);

  try {
    await client.prisma.students.update({
      where: { register_no: regno },
      data: {
        ug_cgpa: body?.ug_cgpa !== undefined && body?.ug_cgpa !== null && !isNaN(Number(body.ug_cgpa)) ? Number(body.ug_cgpa) : null,
        gate_score: body?.gate_score !== undefined && body?.gate_score !== null && !isNaN(Number(body.gate_score)) ? Number(body.gate_score) : null,
        work_experience: body?.work_experience ?? null,
      },
    });

    return {
      message: "PG information updated successfully.",
    };
  } catch (error: any) {
    console.error("Error updating PG info:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusText: "Failed to update PG information.",
    });
  }
});
