import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Check if SuperAdmin exists
    const existingSuperAdmin = await prisma.user.findUnique({
        where: { login: 'superadmin' }
    });

    if (!existingSuperAdmin) {
        // Create SuperAdmin
        await prisma.user.create({
            data: {
                login: 'superadmin',
                password: await bcrypt.hash('admin123', 10),
                firstName: 'Главный',
                lastName: 'Администратор',
                role: 'SUPERADMIN',
            },
        });
        console.log('✅ Created SuperAdmin');
    } else {
        console.log('ℹ️ SuperAdmin already exists');
    }

    console.log('🎉 Seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
