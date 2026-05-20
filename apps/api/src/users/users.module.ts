import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordHasherService } from './password-hasher.service';
import { User } from './user.entity';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [PasswordHasherService, UserService],
  exports: [TypeOrmModule, PasswordHasherService, UserService],
})
export class UsersModule {}
