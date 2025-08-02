import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { LoggerService } from './app/bot/utils/logger/logger.service';
import { NestLoggerAdapter } from './app/bot/utils/logger/nest-logger.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(LoggerService).getLogger('Main');
  app.useLogger(new NestLoggerAdapter(logger));
  await app.listen(process.env.PORT || 9000);
}
bootstrap();
