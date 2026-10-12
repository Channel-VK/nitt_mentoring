import { Client } from "../../utils/database.js";
import { getTokenFromEvent } from "../../utils/auth.js";

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
  if (Number(jwtPayload.level) < 2) {
    throw createError({
      statusCode: 401,
      statusText: "You do not have permission.",
    });
  }

  const current = await client.prisma.faculty.findFirst({
    where: { user_id: Number(jwtPayload.id) },
  });

  if (!current && Number(jwtPayload.level) >= 3) {
    // Admin without dedicated faculty record
    const query = getQuery(e);
    const departmentFilter = query.department_id ? { department_id: String(query.department_id) } : {};
    const users = await client.prisma.students.findMany({
      where: departmentFilter,
      include: {
        mentor: {
          include: { department: true }
        },
        department: true,
        user: true,
      },
      orderBy: [
        { year: "asc" },
        { register_no: "asc" },
      ],
    });
    return users.map((user) => ({
      ...client.manager.createPartialStudent(user),
      username: user.user?.username,
    }));
  }

  if (!current) {
    throw createError({
      statusCode: 404,
      statusText: "Faculty profile not found for this HOD.",
    });
  }

  const users = await client.prisma.students.findMany({
    where: { department_id: current.department_id },
    include: {
      mentor: {
        include: { department: true }
      },
      department: true,
      user: true,
    },
    orderBy: [
      { year: "asc" },
      { register_no: "asc" },
    ],
  });

  return users.map((user) => ({
    ...client.manager.createPartialStudent(user),
    username: user.user?.username,
  }));
});
