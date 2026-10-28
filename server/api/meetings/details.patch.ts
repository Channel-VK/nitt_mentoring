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

  if (Number(jwtPayload.level) < 1) {
    throw createError({
      statusCode: 403,
      statusText: "You do not have permission.",
    });
  }

  const body = await readBody<{
    meetingId: number;
    date: Date | string;
    discussion: string;
  }>(e);

  if (!body || !body.meetingId || !body.date || body.discussion === undefined) {
    throw createError({
      statusCode: 400,
      statusText: "Invalid Form Body",
    });
  }

  const parsedDate = new Date(body.date);
  if (isNaN(parsedDate.getTime())) {
    throw createError({
      statusCode: 400,
      statusText: "Invalid date format",
    });
  }

  try {
    await client.prisma.meetings.update({
      where: { id: Number(body.meetingId) },
      data: {
        date: parsedDate,
        discussion: String(body.discussion),
      },
    });
    return { message: "Meeting updated successfully!" };
  } catch (err: any) {
    console.error("Error updating meeting:", err);
    throw createError({
      statusCode: 500,
      statusText: "Failed to update meeting",
      message: err?.message,
    });
  }
});
