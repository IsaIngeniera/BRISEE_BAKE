import 'dotenv/config';
import { PrismaClient, Rol, EstadoUsuario } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  console.log("DB URL:", process.env.DATABASE_URL);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$connect();
    let admin = await prisma.usuario.findUnique({
      where: { correo: 'admin@briseebake.com' }
    });
    console.log("Admin exists:", !!admin);

    if (!admin) {
      admin = await prisma.usuario.create({
        data: {
          nombre: 'Admin',
          apellido: 'Mock',
          correo: 'admin@briseebake.com',
          password: 'hashed_password_mock',
          rol: Rol.ADMIN,
          celular: '1234567890',
          estado: EstadoUsuario.ACTIVO,
          fechaNacimiento: new Date('1990-01-01'),
          createdAt: new Date()
        }
      });
      console.log("Admin created");
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
