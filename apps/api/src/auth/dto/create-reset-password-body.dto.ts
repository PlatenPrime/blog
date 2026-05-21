import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateResetPasswordBodyDto {
  @IsString()
  @MinLength(16)
  @MaxLength(512)
  passwordResetToken!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
