import { Module } from '@nestjs/common';
import { UserMenuService } from './user-menu.service';
import { UserMenuController } from './user-menu.controller';

@Module({
  providers: [UserMenuService],
  controllers: [UserMenuController]
})
export class UserMenuModule {}
