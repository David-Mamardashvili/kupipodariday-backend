import { IsBoolean, IsNumber, IsPositive } from 'class-validator';

export class CreateOfferDto {
  @IsNumber()
  itemId: number;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsBoolean()
  hidden: boolean;
}
