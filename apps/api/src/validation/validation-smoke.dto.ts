import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ValidationSmokeBodyDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  count!: number;
}
