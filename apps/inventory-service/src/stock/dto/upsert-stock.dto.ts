import { IsInt, Min } from 'class-validator';

export class UpsertStockDto {
  @IsInt()
  @Min(1)
  productId: number;

  @IsInt()
  @Min(0)
  quantity: number;
}
