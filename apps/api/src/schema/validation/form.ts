import z from "zod";

const formSchemaZod = z
  .object({
    id: z.string(),
    version: z.string(),
    metadata: z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      createdAt: z.string(),
      updatedAt: z.string(),
      author: z.string().optional(),
    }),
    settings: z.record(z.string(), z.unknown()).optional(), // or define fully
    pages: z.array(
      z
        .object({
          id: z.string(),
          label: z.string(),
          order: z.number(),
          sections: z.array(
            z
              .object({
                id: z.string(),
                label: z.string(),
                order: z.number(),
                questions: z.array(
                  z
                    .object({
                      id: z.string(),
                      type: z.string(),
                      label: z.string(),
                      name: z.string(),
                      required: z.boolean(),
                      order: z.number(),
                    })
                    .passthrough(),
                ), // allow config, validation, etc.
              })
              .passthrough(),
          ),
        })
        .passthrough(),
    ),
    validation: z.array(z.unknown()).default([]),
    conditionalLogic: z.array(z.unknown()).optional(),
  })
  .passthrough();

export type FormSchemaType = z.infer<typeof formSchemaZod>;

export const createFormBodySchema = z.object({
  workspaceId: z.string().min(1),
  schema: formSchemaZod,
});
