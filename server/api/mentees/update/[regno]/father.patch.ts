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
    name?: string;
    occupation?: string;
    mobile_number?: string;
    whatsapp_number?: string;
    email_id?: string;
    address?: string;
  }>(e);

  try {
    await client.prisma.students.update({
      where: { register_no: regno },
      data: {
        f_name: body?.name,
        f_occupation: body?.occupation,
        f_mobile_number: body?.mobile_number,
        f_whatsapp_number: body?.whatsapp_number,
        f_email_id: body?.email_id,
        f_address: body?.address,
      },
    });

    return {
      message: "Father details updated successfully.",
    };
  } catch (error: any) {
    console.error("Error updating father info:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusText: "Failed to update father details.",
    });
  }
});
