import { Client } from "../../utils/database.js";
import { getTokenFromEvent } from "../../utils/auth.js";
import { verifyJwt } from "../../utils/jwt.js";

const client = new Client();

interface AssignmentChange {
  regno: string;
  mentor_id: number; // -1 for unassigned, positive integer for faculty id
}

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

  if (Number(jwtPayload.level) < 2) {
    throw createError({
      statusCode: 403,
      statusText: "You do not have permission.",
    });
  }

  const body = await readBody<{ changes: AssignmentChange[] }>(e);
  if (!body || !Array.isArray(body.changes) || body.changes.length === 0) {
    return {
      message: "No changes provided.",
      count: 0,
    };
  }

  const toAssign: Record<number, string[]> = {};
  const toUnassign: string[] = [];

  for (const item of body.changes) {
    const regno = String(item.regno).trim();
    if (!regno) continue;
    const mentorId = Number(item.mentor_id);
    if (mentorId === -1 || isNaN(mentorId)) {
      toUnassign.push(regno);
    } else {
      if (!toAssign[mentorId]) {
        toAssign[mentorId] = [];
      }
      toAssign[mentorId].push(regno);
    }
  }

  try {
    await client.prisma.$transaction(async (prisma) => {
      if (toUnassign.length > 0) {
        await prisma.students.updateMany({
          where: { register_no: { in: toUnassign } },
          data: { mentor_id: null },
        });
      }

      for (const [mentorIdStr, regnos] of Object.entries(toAssign)) {
        const mentorId = Number(mentorIdStr);
        const mentor = await prisma.faculty.findFirst({
          where: { id: mentorId },
        });
        if (!mentor) {
          throw createError({
            statusCode: 404,
            statusText: `Faculty with ID ${mentorId} not found.`,
          });
        }

        await prisma.students.updateMany({
          where: { register_no: { in: regnos } },
          data: { mentor_id: mentorId },
        });
      }
    });

    return {
      success: true,
      message: `Successfully updated ${body.changes.length} assignment(s).`,
      count: body.changes.length,
    };
  } catch (error: any) {
    console.error("Batch assignment error:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusText: error.message || "Failed to update mentee assignments.",
    });
  }
});
