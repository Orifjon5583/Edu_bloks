import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
    const branches = await prisma.branch.count();
    const groups = await prisma.group.count();
    const users = await prisma.user.count();
    const superAdmin = await prisma.user.findUnique({ where: { login: 'superadmin' } });

    console.log(`Branches: ${branches}`);
    console.log(`Groups: ${groups}`);
    console.log(`Users: ${users}`);

    if (users === 1 && superAdmin && branches === 0 && groups === 0) {
        console.log('✅ Database is CLEAN (Only SuperAdmin exists)');
    } else {
        console.log('❌ Database is NOT clean');
    }
}

verify().finally(() => prisma.$disconnect());
