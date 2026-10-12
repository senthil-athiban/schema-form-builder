import { prisma } from "@form-builder/db";
import { auth } from "../lib/auth";

const [email, password] = process.argv.slice(2);

if (!email || !password || password.length < 8) {
  console.error("Usage: npm run auth:set-password -w @form-builder/api -- <email> <password (8+ chars)>");
  process.exit(1);
}

const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
if (!user) {
  console.error(`No user with email ${email}`);
  process.exit(1);
}

const { password: hasher } = await auth.$context;
const hash = await hasher.hash(password);

const existing = await prisma.account.findFirst({
  where: { userId: user.id, providerId: "credential" },
});

if (existing) {
  await prisma.account.update({ where: { id: existing.id }, data: { password: hash } });
} else {
  await prisma.account.create({
    data: { userId: user.id, accountId: user.id, providerId: "credential", password: hash },
  });
}

await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });

console.log(`Password ${existing ? "updated" : "set"} for ${user.email} (email marked verified)`);
await prisma.$disconnect();
