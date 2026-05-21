import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateVerifyEmailBodyDto {
  @IsString()
  @MinLength(16)
  @MaxLength(512)
  emailVerificationToken!: string;
}
