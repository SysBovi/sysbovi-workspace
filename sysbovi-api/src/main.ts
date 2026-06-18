import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ─── Swagger ─────────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SysBovi API')
    .setDescription(
      'API REST de gestão pecuária multi-tenant. ' +
      'Autentique via **POST /api/auth/login**, copie o campo `accessToken` da resposta ' +
      'e cole no botão **Authorize** (Bearer). ' +
      'O frontend web usa cookie HttpOnly automaticamente; clientes de API usam o Bearer token.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Token JWT obtido em /api/auth/login' },
      'access-token',
    )
    .addTag('Auth', 'Login de usuários e administradores, logout com revogação de token')
    .addTag('Bovinos', 'CRUD do rebanho — cadastro, edição e consulta de animais')
    .addTag('Pesagens', 'Registro e histórico de pesagens com cálculo de GMD')
    .addTag('Pastos', 'Gestão de lotes, pastagens, rodízio e custo diário')
    .addTag('Insumos', 'Controle de estoque de insumos — vacinas, suplementos, medicamentos')
    .addTag('Dashboard', 'Estatísticas consolidadas do rebanho por tenant')
    .addTag('Avalia Venda', 'Motor de análise financeira para decisão de venda')
    .addTag('Equipe', 'Membros da equipe técnica da fazenda')
    .addTag('Tenants', 'Dados da fazenda e solicitação de upgrade de plano')
    .addTag('Admin', 'Backoffice SaaS — gestão de tenants, faturas e logs')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`SysBovi API rodando na porta ${port}`);
  console.log(`Swagger disponível em http://localhost:${port}/docs`);
}

bootstrap();
