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
    jee_rank?: number | null;
    jee_score?: number | null;
  }>(e);

  try {
    await client.prisma.students.update({
      where: { register_no: regno },
      data: {
        jee_rank: body?.jee_rank !== undefined && body?.jee_rank !== null && !isNaN(Number(body.jee_rank)) ? Number(body.jee_rank) : null,
        jee_score: body?.jee_score !== undefined && body?.jee_score !== null && !isNaN(Number(body.jee_score)) ? Number(body.jee_score) : null,
      },
    });

    return {
      message: "UG information updated successfully.",
    };
  } catch (error: any) {
    console.error("Error updating UG info:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusText: "Failed to update UG information.",
    });
  }
});
