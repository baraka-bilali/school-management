import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function check() {
  try {
    const user = await prisma.user.findUnique({ where: { email: 'super@school.local' } });
    if (user) {
      console.log('✅ SUPER_ADMIN existe:', user.email, user.role);
    } else {
      console.log('❌ SUPER_ADMIN absent, création...');
      const hash = await bcrypt.hash('admin123', 10);
      const newUser = await prisma.user.create({
        data: {
          name: 'Super Admin',
          email: 'super@school.local',
          password: hash,
          role: 'SUPER_ADMIN'
        }
      });
      console.log('✅ SUPER_ADMIN créé:', newUser.email);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
