import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../database/prisma/prisma.module';
import { LoggerModule } from '../../utils/logger/logger.module';
import { UserMenuController } from './user-menu.controller';
import { UserMenuService } from './user-menu.service';

@Module({
  imports: [LoggerModule, PrismaModule],
  controllers: [UserMenuController],
  providers: [UserMenuService],
})
export class UserMenuModule {}
