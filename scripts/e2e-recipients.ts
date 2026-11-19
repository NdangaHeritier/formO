import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { createProjectForm, updateProjectForm } from "../src/server/services/forms.service";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const orgId = randomUUID();
  const projectId = randomUUID();
  const actorUserId = randomUUID();
  await prisma.user.create({
    data: { id: actorUserId, name: "RC", email: `rc-${actorUserId}@test.local` },
  });
  await prisma.organization.create({
    data: { id: orgId, name: "Recipient check", slug: `rc-${randomUUID().slice(0, 8)}` },
  });
  await prisma.project.create({
    data: { id: projectId, organizationId: orgId, name: "RC", slug: `rc-${randomUUID().slice(0, 8)}` },
  });

  const created = await createProjectForm({
    projectId,
    organizationId: orgId,
    actorUserId,
    input: {
      title: "RC form",
      endpoint: `fmo_${randomUUID().slice(0, 12)}`,
      emailTo: "primary@a.test",
      recipients: [
        { email: "cc@b.test", type: "cc" },
        { email: "bcc@c.test", type: "bcc" },
      ],
    },
  });

  let rows = await prisma.formRecipient.findMany({ where: { formId: created.id } });
  console.log("created recipients:", rows.map((r) => `${r.type}:${r.email}`).sort());
  assert.equal(rows.length, 3);

  // Path 1: changing only emailTo must preserve CC and BCC.
  await updateProjectForm({
    formId: created.id,
    organizationId: orgId,
    actorUserId,
    input: { emailTo: "newprimary@a.test" },
  });
  rows = await prisma.formRecipient.findMany({ where: { formId: created.id } });
  console.log("after emailTo-only update:", rows.map((r) => `${r.type}:${r.email}`).sort());
  assert.equal(rows.length, 3);
  assert.ok(rows.some((r) => r.type === "to" && r.email === "newprimary@a.test"));
  assert.ok(!rows.some((r) => r.email === "primary@a.test"));
  assert.ok(rows.some((r) => r.type === "cc" && r.email === "cc@b.test"));
  assert.ok(rows.some((r) => r.type === "bcc" && r.email === "bcc@c.test"));

  // Path 2: providing recipients replaces the full list.
  await updateProjectForm({
    formId: created.id,
    organizationId: orgId,
    actorUserId,
    input: {
      emailTo: "newprimary@a.test",
      recipients: [{ email: "anothercc@d.test", type: "cc" }],
    },
  });
  rows = await prisma.formRecipient.findMany({ where: { formId: created.id } });
  console.log("after full replace:", rows.map((r) => `${r.type}:${r.email}`).sort());
  assert.equal(rows.length, 2);
  assert.ok(rows.some((r) => r.type === "to" && r.email === "newprimary@a.test"));
  assert.ok(rows.some((r) => r.type === "cc" && r.email === "anothercc@d.test"));
  assert.ok(!rows.some((r) => r.email === "cc@b.test"));

  console.log("recipient update check: PASS");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

