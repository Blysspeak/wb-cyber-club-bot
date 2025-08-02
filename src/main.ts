import { NestFactory } from '@nestjs/core';
import { getBotToken } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { AppModule } from './app/app.module';
import { LoggerService } from './app/bot/utils/logger/logger.service';
import { NestLoggerAdapter } from './app/bot/utils/logger/nest-logger.adapter';
import { PrismaService } from './app/database/prisma/prisma.service';
import { RedisService } from './app/database/redis/redis.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Полностью отключаем стандартный логгер, чтобы избежать конфликтов типов
    logger: false,
  });

  const loggerService = app.get(LoggerService);
  const mainLogger = loggerService.getLogger('Main');
  // Устанавливаем наш кастомный логгер для всего приложения
  app.useLogger(new NestLoggerAdapter(mainLogger));

  const prismaService = app.get(PrismaService);
  const redisService = app.get(RedisService);
  const bot = app.get<Telegraf>(getBotToken());

  const PORT = process.env.PORT || 9001;

  try {
    await app.listen(PORT);
  } catch (e) {
    mainLogger.fatal('Could not start application', 'Bootstrap', e);
    await app.close();
    process.exit(1);
  }

  let postgresStatus = '❌ disconnected';
  try {
    await prismaService.$queryRaw`SELECT 1`;
    postgresStatus = '✅ connected';
  } catch (e) {
    mainLogger.error('PostgreSQL connection failed', 'Bootstrap', e);
  }

  let redisStatus = '❌ disconnected';
  try {
    if ((await redisService.getClient().ping()) === 'PONG') {
      redisStatus = '✅ connected';
    }
  } catch (e) {
    mainLogger.error('Redis connection failed', 'Bootstrap', e);
  }

  try {
    const botInfo = await bot.telegram.getMe();
    const botUsername = botInfo.username;

    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(
      now.getMonth() + 1,
    ).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(
      now.getHours(),
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(
      now.getSeconds(),
    ).padStart(2, '0')}`;

    mainLogger.raw(
      `\n🚀 [${timestamp}] Бот @${botUsername} запущен на порту ${PORT}.`,
    );
    mainLogger.raw('📦 Статус сервисов:');
    mainLogger.raw(`  - 🐘 PostgreSQL: ${postgresStatus}`);
    mainLogger.raw(`  - ⚡ Redis:       ${redisStatus}\n`);
  } catch (e) {
    mainLogger.fatal(
      'Could not get bot info. Is BOT_TOKEN correct?',
      'Bootstrap',
      e,
    );
    await app.close();
    process.exit(1);
  }
}

bootstrap();
