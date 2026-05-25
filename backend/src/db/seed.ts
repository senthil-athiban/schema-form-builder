import { FormStatus, WorkspaceRole } from "@prisma/client";
import { prisma } from "./prisma";

const sampleFormSchema = {
  id: "contact-form",
  version: "1",
  metadata: {
    title: "Contact Us",
    description: "Get in touch with our team",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  settings: {
    submitButton: { label: "Submit", position: "center" },
  },
  pages: [
    {
      id: "page-1",
      label: "Contact",
      order: 0,
      sections: [
        {
          id: "section-1",
          label: "Your details",
          order: 0,
          questions: [
            {
              id: "q-name",
              type: "text",
              label: "Full name",
              name: "fullName",
              required: true,
              order: 0,
            },
            {
              id: "q-email",
              type: "email",
              label: "Email",
              name: "email",
              required: true,
              order: 1,
            },
            {
              id: "q-message",
              type: "textarea",
              label: "Message",
              name: "message",
              required: false,
              order: 2,
            },
          ],
        },
      ],
    },
  ],
  validation: [],
};

async function main() {
  const user = await prisma.user.upsert({
    where: {
      email: "senthil@example.com",
    },
    update: {},
    create: {
      name: "Senthil",
      email: "senthil@example.com",
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: {
      slug: "indiclinic",
    },
    update: {},
    create: {
      name: "Indiclinic",
      slug: "indiclinic",
    },
  });

  await prisma.workspaceUser.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: user.id,
      role: WorkspaceRole.OWNER,
    },
  });

  const form = await prisma.form.upsert({
    where: { id: "seed-contact-form" },
    update: {
      status: FormStatus.PUBLISHED,
      latestVersion: 1,
    },
    create: {
      id: "seed-contact-form",
      workspaceId: workspace.id,
      name: "Contact Us",
      description: "Sample published form for testing submissions",
      status: FormStatus.PUBLISHED,
      latestVersion: 1,
    },
  });

  await prisma.formVersion.upsert({
    where: {
      formId_version: {
        formId: form.id,
        version: 1,
      },
    },
    update: {
      schema: sampleFormSchema,
    },
    create: {
      formId: form.id,
      version: 1,
      schema: sampleFormSchema,
    },
  });

  console.log("✅ Seed data created successfully");
  console.log({
    workspaceId: workspace.id,
    userId: user.id,
    formId: form.id,
    submitUrl: `POST /api/v1/forms/${form.id}/submissions`,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
