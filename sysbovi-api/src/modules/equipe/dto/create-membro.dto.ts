import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoMembro } from '../../../database/entities/membro-equipe.entity';

export class CreateMembroDto {
  @ApiProperty({ example: 'Dr. João Silva', description: 'Nome completo do membro' })
  @IsString()
  @MaxLength(100)
  nome: string;

  @ApiProperty({ example: 'joao.silva@fazenda.com', description: 'E-mail de contato' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: ['VETERINARIO', 'ZOOTECNISTA', 'AGRONOMO', 'TECNICO'], example: 'VETERINARIO', description: 'Tipo de profissional' })
  @IsEnum(['VETERINARIO', 'ZOOTECNISTA', 'AGRONOMO', 'TECNICO'])
  tipo: TipoMembro;

  @ApiPropertyOptional({ example: '(11) 99999-0001', description: 'Telefone de contato (máx. 20 chars)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;
}
