import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembroEquipe } from '../../database/entities/membro-equipe.entity';
import { CreateMembroDto } from './dto/create-membro.dto';
import { UpdateMembroDto } from './dto/update-membro.dto';

@Injectable()
export class EquipeService {
  constructor(
    @InjectRepository(MembroEquipe)
    private membrosRepository: Repository<MembroEquipe>,
  ) {}

  async findAll(tenantId: string) {
    return this.membrosRepository.find({
      where: { tenantId, ativo: true },
      order: { nome: 'ASC' },
    });
  }

  async create(dto: CreateMembroDto, tenantId: string) {
    const membro = this.membrosRepository.create({
      ...dto,
      tenantId,
      telefone: dto.telefone ?? null,
    });
    return this.membrosRepository.save(membro);
  }

  async update(id: string, dto: UpdateMembroDto, tenantId: string) {
    const membro = await this.membrosRepository.findOne({ where: { id, tenantId, ativo: true } });
    if (!membro) throw new NotFoundException('Membro não encontrado.');
    Object.assign(membro, dto);
    return this.membrosRepository.save(membro);
  }

  async remove(id: string, tenantId: string) {
    const membro = await this.membrosRepository.findOne({ where: { id, tenantId } });
    if (!membro) throw new NotFoundException('Membro não encontrado.');
    membro.ativo = false;
    await this.membrosRepository.save(membro);
  }
}
