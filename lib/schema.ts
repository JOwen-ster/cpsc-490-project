import { prisma } from "./db";

export async function ensureUserAndSeed(user: {
  id: string;
  username: string;
  image?: string;
}) {
  // Upsert user using Prisma
  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      username: user.username,
      avatarUrl: user.image || null,
    },
    create: {
      id: user.id,
      username: user.username,
      avatarUrl: user.image || null,
    },
  });
}
