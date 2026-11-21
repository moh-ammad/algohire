import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../generated/prisma/client.js";
import { hashPassword } from "../src/lib/password.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = "password123";

async function main() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const district = await prisma.district.upsert({
    where: { code: "D-01" },
    update: { name: "Central District" },
    create: { code: "D-01", name: "Central District" },
  });

  const centre = await prisma.trainingCentre.upsert({
    where: { code: "TC-ANIKA" },
    update: { name: "Anika Skills Centre", districtId: district.id },
    create: {
      code: "TC-ANIKA",
      name: "Anika Skills Centre",
      districtId: district.id,
    },
  });

  const demos: Array<{
    email: string;
    name: string;
    role: Role;
    centreId?: string;
    districtId?: string;
  }> = [
    {
      email: "anika@centre.test",
      name: "Anika",
      role: Role.CENTRE,
      centreId: centre.id,
      districtId: district.id,
    },
    {
      email: "dev@district.test",
      name: "Dev",
      role: Role.DISTRICT,
      districtId: district.id,
    },
    {
      email: "meera@district.test",
      name: "Meera",
      role: Role.DISTRICT,
      districtId: district.id,
    },
    {
      email: "kabir@district.test",
      name: "Kabir",
      role: Role.DISTRICT,
      districtId: district.id,
    },
    {
      email: "neha@quality.test",
      name: "Neha",
      role: Role.QUALITY,
    },
    {
      email: "farah@state.test",
      name: "Farah",
      role: Role.STATE,
    },
  ];

  for (const demo of demos) {
    await prisma.user.upsert({
      where: { email: demo.email },
      update: {
        name: demo.name,
        role: demo.role,
        passwordHash,
        centreId: demo.centreId ?? null,
        districtId: demo.districtId ?? null,
      },
      create: {
        email: demo.email,
        name: demo.name,
        role: demo.role,
        passwordHash,
        centreId: demo.centreId ?? null,
        districtId: demo.districtId ?? null,
      },
    });
  }

  console.log("Seed complete. Demo password for all users:", DEMO_PASSWORD);
  console.log(demos.map((d) => `${d.name} <${d.email}> [${d.role}]`).join("\n"));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
