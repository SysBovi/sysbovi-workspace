import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../../database/entities/tenant.entity';
import { FaturaSaas } from '../../database/entities/fatura-saas.entity';
import { LogAuditoria } from '../../database/entities/log-auditoria.entity';
import { BackofficeController } from './backoffice.controller';
import { BackofficeService } from './backoffice.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, FaturaSaas, LogAuditoria])],
  controllers: [BackofficeController],
  providers: [BackofficeService],
})
export class BackofficeModule {}
