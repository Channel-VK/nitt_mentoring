import { PrismaClient } from '@prisma/client';
import { hash } from "bcrypt";

const client = new PrismaClient();

async function init() {
  console.log("🔄 [DOCKER INIT] Checking database initialization...");

  try {
    // 1. Seed standard departments if not already present
    const departments = [
      { id: 'CSE', name: 'Computer Science and Engineering' },
      { id: 'ECE', name: 'Electronics and Communication Engineering' },
      { id: 'EEE', name: 'Electrical and Electronics Engineering' },
      { id: 'MECH', name: 'Mechanical Engineering' },
      { id: 'CIVIL', name: 'Civil Engineering' },
      { id: 'CHEM', name: 'Chemical Engineering' },
      { id: 'MME', name: 'Metallurgical and Materials Engineering' },
      { id: 'ICE', name: 'Instrumentation and Control Engineering' },
      { id: 'PROD', name: 'Production Engineering' },
      { id: 'ARCH', name: 'Architecture' },
    ];

    for (const dept of departments) {
      const existing = await client.department.findUnique({ where: { id: dept.id } });
      if (!existing) {
        await client.department.create({ data: dept });
        console.log(`✅ [DOCKER INIT] Created department: ${dept.id} - ${dept.name}`);
      }
    }

    // 2. Check if an admin user exists
    const adminUser = await client.users.findFirst({
      where: { level: 3 }
    });

    if (!adminUser) {
      const defaultAdminUsername = process.env.ADMIN_USERNAME || "admin";
      const defaultAdminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
      const saltRounds = Number(process.env.BCRYPT_SALT) || 10;
      const hashedPassword = await hash(defaultAdminPassword, saltRounds);

      const createdAdmin = await client.users.create({
        data: {
          username: defaultAdminUsername,
          password: hashedPassword,
          level: 3
        }
      });
      console.log(`🎉 [DOCKER INIT] Created initial admin account: username='${createdAdmin.username}' password='${defaultAdminPassword}'`);
    } else {
      console.log(`ℹ️ [DOCKER INIT] Admin user already exists: ${adminUser.username}`);
    }

    console.log("✅ [DOCKER INIT] Database setup complete!");
  } catch (error) {
    console.error("⚠️ [DOCKER INIT] Database initialization notice:", error.message);
  } finally {
    await client.$disconnect();
  }
}

init();
