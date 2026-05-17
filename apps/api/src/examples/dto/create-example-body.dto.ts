import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateExampleBodyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;
}
