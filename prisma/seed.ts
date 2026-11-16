import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run prisma/seed.ts");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const org = await prisma.organization.upsert({
      where: { slug: "formo-demo-workspace" },
      update: { name: "FormO Demo Workspace" },
      create: {
        name: "FormO Demo Workspace",
        slug: "formo-demo-workspace",
      },
    });

    let project = await prisma.project.findFirst({
      where: {
        organizationId: org.id,
        slug: "marketing-site",
        deletedAt: null,
      },
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          organizationId: org.id,
          name: "Marketing Site",
          slug: "marketing-site",
          description: "Default workspace project for contact and lead capture forms.",
          status: "active",
        },
      });
    }

    const form = await prisma.projectForm.upsert({
      where: { endpoint: "demo_contact_form" },
      update: {},
      create: {
        projectId: project.id,
        title: "Contact Us",
        description: "Seeded contact endpoint for local verification.",
        endpoint: "demo_contact_form",
        emailTo: "inbox@example.com",
        replyToField: "email",
        customSubject: "New message on {{formTitle}}",
        honeypotField: "_gotcha",
        allowedOrigins: [],
        maxPayloadBytes: 65536,
        isActive: true,
      },
    });

    await prisma.formRecipient.upsert({
      where: {
        formId_email_type: {
          formId: form.id,
          email: "inbox@example.com",
          type: "to",
        },
      },
      update: { isActive: true },
      create: {
        formId: form.id,
        email: "inbox@example.com",
        type: "to",
        isActive: true,
      },
    });

    console.log("Seed complete:", {
      organizationId: org.id,
      projectId: project.id,
      formEndpoint: form.endpoint,
    });
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
