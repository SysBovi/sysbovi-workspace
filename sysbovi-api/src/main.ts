import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
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

  /*app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });*/ //comentado por Fabiano - Adaptação para Vercel e Render

  const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL, // Pega o link configurado no Render
  ].filter(Boolean); // Remove valores nulos ou indefinidos

  app.enableCors({
    origin: (origin, callback) => {
      // Se não houver origin (ex: chamadas internas ou ferramentas de teste como Swagger/Postman)
      if (!origin) {
        return callback(null, true);
      }

      // Verifica se a origem está na lista permitida OU se é um subdomínio da Vercel do seu time
      const isAllowed = allowedOrigins.includes(origin);
      const isVercelDeploy = origin.endsWith('.vercel.app') && origin.includes('sysbovi');

      if (isAllowed || isVercelDeploy) {
        callback(null, true);
      } else {
        callback(new Error('Bloqueado pelo CORS do SysBovi'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Mantém ativo para o envio dos cookies HttpOnly
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
