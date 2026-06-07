import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const PLANOS_KEY = 'planosPermitidos';
export const PlanosPermitidos = (...planos: string[]) => SetMetadata(PLANOS_KEY, planos);

@Injectable()
export class PlanoGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const planosPermitidos = this.reflector.getAllAndOverride<string[]>(PLANOS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!planosPermitidos || planosPermitidos.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user?.planoNome || !planosPermitidos.includes(user.planoNome)) {
      throw new ForbiddenException(
        `Esta funcionalidade está disponível apenas nos planos: ${planosPermitidos.join(', ')}.`,
      );
    }

    return true;
  }
}
