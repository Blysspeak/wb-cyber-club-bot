import { Module } from '@nestjs/common';
import { RegistrationScene } from './registration.scene';

@Module({
  providers: [RegistrationScene],
  exports: [RegistrationScene],
})
export class RegistrationModule {}
