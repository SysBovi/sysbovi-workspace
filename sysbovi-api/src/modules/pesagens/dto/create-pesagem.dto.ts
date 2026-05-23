import { IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

export class CreatePesagemDto {
  @IsNumber()
  @Min(1)
  peso: number;

  @IsOptional()
  @IsDateString()
  dataPesagem?: string;
}
