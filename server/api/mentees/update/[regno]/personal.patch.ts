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
    blood_group?: string;
    mobile_number?: string;
    whatsapp_number?: string;
    date_of_birth?: string | Date;
    gender?: string;
    email_id?: string;
  }>(e);

  let dob: Date | null | undefined = undefined;
  if (body?.date_of_birth) {
    const parsed = new Date(body.date_of_birth);
    if (!isNaN(parsed.getTime())) {
      dob = parsed;
    }
  }

  try {
    await client.prisma.students.update({
      where: { register_no: regno },
      data: {
        blood_group: body?.blood_group,
        mobile_number: body?.mobile_number,
        whatsapp_number: body?.whatsapp_number,
        date_of_birth: dob,
        gender: body?.gender,
        email_id: body?.email_id,
      },
    });

    return {
      message: "Personal details updated successfully.",
    };
  } catch (error: any) {
    console.error("Error updating personal info:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusText: "Failed to update personal details.",
    });
  }
});
