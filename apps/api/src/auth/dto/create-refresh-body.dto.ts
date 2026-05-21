import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateRefreshBodyDto {
  @IsString()
  @MinLength(16)
  @MaxLength(512)
  refreshToken!: string;
}
