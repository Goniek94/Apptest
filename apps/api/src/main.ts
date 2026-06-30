import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Bezpieczeństwo i podstawowy middleware
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  // W developmencie odbijamy origin żądania (Expo web na :8081, prototyp na :3000 itd.).
  // Na produkcji zawężamy do FRONTEND_URL. Apka natywna używa Bearer (CORS jej nie dotyczy).
  const isDev = config.get<string>('NODE_ENV') !== 'production';
  app.enableCors({
    origin: isDev ? true : config.get<string>('FRONTEND_URL'),
    credentials: true,
  });

  // Globalna walidacja DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();

  // Dokumentacja API (Swagger)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ModaMarket API')
    .setDescription('API platformy marketplace (moda) — mobile-first')
    .setVersion('0.1')
    .addBearerAuth()
    .addTag('auth', 'Rejestracja, logowanie, tokeny')
    .addTag('users', 'Profil użytkownika')
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);

  Logger.log(
    `ModaMarket API → http://localhost:${port}/api/v1  |  Docs → http://localhost:${port}/api/docs`,
    'Bootstrap',
  );
}

void bootstrap();
