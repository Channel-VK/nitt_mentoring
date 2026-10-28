import { Client } from "../../utils/database.js";
import { getTokenFromEvent } from "../../utils/auth.js";
import { verifyJwt } from "../../utils/jwt.js";

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
  const regno = getRouterParam(e, "regno");
  if (!regno) {
    throw createError({
      statusCode: 400,
      statusText: "Registration number is required.",
    });
  }

  if (Number(jwtPayload.level) < 2) {
    throw createError({
      statusCode: 403,
      statusText: "You do not have permission.",
    });
  }
  const body = await readBody<{ mentor_id: number | string }>(e);
  const mentorId = Number(body?.mentor_id);

  try {
    // Special case for unassigning a mentor
    if (mentorId === -1 || isNaN(mentorId)) {
      await client.prisma.students.update({
        where: { register_no: regno },
        data: { mentor_id: null },
      });
      return {
        message: "Successfully unassigned mentor.",
      };
    }

    // For assigning a mentor, verify the mentor exists first
    const mentor = await client.prisma.faculty.findFirst({
      where: { id: mentorId },
    });
    
    if (mentor) {
      await client.prisma.students.update({
        where: { register_no: regno },
        data: { mentor_id: mentorId },
      });
      return {
        message: "Successfully assigned mentor.",
      };
    } else {
      throw createError({
        statusCode: 404,
        statusMessage: "Mentor not found.",
      });
    }
  } catch (error: any) {
    if (error.statusCode) throw error;
    console.error(`Error updating mentor for ${regno}:`, error);
    throw createError({
      statusCode: 500,
      statusText: error.message || "Failed to update mentor assignment.",
    });
  }
});
