import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateExampleBodyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body?: string;
}
