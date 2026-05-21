import { IsEmail, MaxLength } from 'class-validator';

export class CreateRequestPasswordResetBodyDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;
}
