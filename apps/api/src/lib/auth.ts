import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@form-builder/db";
import { createPersonalWorkspace } from "./workspace";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  trustedOrigins: [process.env.WEB_ORIGIN ?? "http://localhost:5173"],
  advanced: {
    database: { generateId: false },
  },
  databaseHooks: {
    user: {
      create: {
        // Every new account gets its own workspace
        after: async (user) => {
          await createPersonalWorkspace(user);
        },
      },
    },
  },
});
