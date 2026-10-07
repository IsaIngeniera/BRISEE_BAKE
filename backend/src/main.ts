import 'dotenv/config';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  app.enableCors(); // <--- Habilitamos CORS aquí

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Brisee Bake API')
    .setDescription('API del Backend para Brisee Bake')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const document = SwaggerModule.createDocument(app as any, config);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  SwaggerModule.setup('api', app as any, document);

  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
