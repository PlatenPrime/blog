import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordHasherService } from './password-hasher.service';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [PasswordHasherService],
  exports: [TypeOrmModule, PasswordHasherService],
})
export class UsersModule {}
