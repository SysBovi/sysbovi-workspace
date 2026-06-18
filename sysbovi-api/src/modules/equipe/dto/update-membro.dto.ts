import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TipoMembro } from '../../../database/entities/membro-equipe.entity';

export class UpdateMembroDto {
  @ApiPropertyOptional({ example: 'Dr. João Silva', description: 'Nome completo do membro' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nome?: string;

  @ApiPropertyOptional({ example: 'joao.silva@fazenda.com', description: 'E-mail de contato' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: ['VETERINARIO', 'ZOOTECNISTA', 'AGRONOMO', 'TECNICO'], example: 'VETERINARIO', description: 'Tipo de profissional' })
  @IsOptional()
  @IsEnum(['VETERINARIO', 'ZOOTECNISTA', 'AGRONOMO', 'TECNICO'])
  tipo?: TipoMembro;

  @ApiPropertyOptional({ example: '(11) 99999-0001', description: 'Telefone de contato (máx. 20 chars)' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;
}
