import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());

  // CORS_ORIGIN admite lista separada por comas. Una entrada que empieza y
  // termina con `/` se interpreta como regex (ej. `/^https:\/\/.*\.vercel\.app$/`).
  // Una entrada igual a `*` permite cualquier origen (sólo dev).
  const rawOrigins = config.get<string>('CORS_ORIGIN', 'http://localhost:3000');
  const patterns = rawOrigins
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = patterns.some((p) => {
        if (p === '*') return true;
        if (p.startsWith('/') && p.endsWith('/')) {
          return new RegExp(p.slice(1, -1)).test(origin);
        }
        return p === origin;
      });
      if (allowed) callback(null, true);
      else callback(new Error(`CORS: origin not allowed (${origin})`));
    },
    credentials: true,
  });

  const port = config.get<number>('PORT', 3001);
  await app.listen(port);
}
void bootstrap();
