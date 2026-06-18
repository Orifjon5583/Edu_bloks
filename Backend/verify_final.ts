import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
    const users = await prisma.user.findMany();
    console.log(`Total users: ${users.length}`);
    users.forEach(u => console.log(`- ${u.login} (${u.role})`));
}

verify().finally(() => prisma.$disconnect());
