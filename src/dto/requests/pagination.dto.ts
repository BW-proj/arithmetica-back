import { IsInt, Min, IsOptional } from "class-validator";
import { DTO } from "../dto";

export class PaginationDto extends DTO {
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
