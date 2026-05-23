import { IsEmail, MaxLength } from 'class-validator';

export class CreateResendVerificationBodyDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;
}
