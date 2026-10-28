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
        m_name: body?.name,
        m_occupation: body?.occupation,
        m_mobile_number: body?.mobile_number,
        m_whatsapp_number: body?.whatsapp_number,
        m_email_id: body?.email_id,
        m_address: body?.address,
      },
    });

    return {
      message: "Mother details updated successfully.",
    };
  } catch (error: any) {
    console.error("Error updating mother info:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      statusText: "Failed to update mother details.",
    });
  }
});
