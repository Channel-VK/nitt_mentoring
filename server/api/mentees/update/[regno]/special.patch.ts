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
    positions_of_responsibility?: string;
    scholarships?: string;
    competitions?: string;
    special_talents?: string;
    role_model?: string;
    objectives?: string;
    extra_curricular?: string;
  }>(e);

  try {
    await client.prisma.students.update({
      where: { register_no: regno },
      data: {
        positions_of_responsibility: body?.positions_of_responsibility,
        scholarships: body?.scholarships,
        competitions: body?.competitions,
        special_talents: body?.special_talents,
        role_model: body?.role_model,
        objectives: body?.objectives,
        extra_curricular: body?.extra_curricular,
      },
    });

    return {
      message: "Special details updated successfully.",
    };
  } catch (error: any) {
    console.error("Error updating special info:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusText: "Failed to update special details.",
    });
  }
});
