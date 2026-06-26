import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

const COOKIE_NAME = 'sysbovi_token';

/*const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};*/ //Alterado por Fabiano para ajudar no Deploy onde diz: O parâmetro sameSite: 'strict' diz para o navegador: "Só salve este cookie se o site de onde ele veio for EXATAMENTE o mesmo site em que o usuário está navegando".

const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax', // O TypeScript vai adorar isso aqui!
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};


@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiOperation({
    summary: 'Login de usuário da fazenda',
    description:
      'Autentica o usuário e retorna o JWT em dois lugares: ' +
      'cookie HttpOnly `sysbovi_token` (usado pelo frontend web) ' +
      'e campo `accessToken` no corpo da resposta (usado por clientes de API e pelo Swagger). ' +
      'Cole o valor de `accessToken` no botão **Authorize** para testar os demais endpoints.',
  })
  @ApiResponse({ status: 200, description: 'Login realizado. Retorna dados do usuário + accessToken.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas ou conta bloqueada.' })
  async loginUsuario(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.loginUsuario(dto);
    res.cookie(COOKIE_NAME, data.accessToken, cookieOptions);
    return data;
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @ApiOperation({
    summary: 'Login do super administrador',
    description:
      'Autentica o admin do backoffice SaaS. Retorna o JWT no cookie HttpOnly ' +
      'e no campo `accessToken` do corpo — cole-o no **Authorize** para testar endpoints Admin.',
  })
  @ApiResponse({ status: 200, description: 'Login realizado. Retorna dados do admin + accessToken.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async loginAdmin(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.loginAdmin(dto);
    res.cookie(COOKIE_NAME, data.accessToken, cookieOptions);
    return data;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Dados do usuário autenticado', description: 'Retorna os dados do usuário autenticado. Aceita cookie HttpOnly (frontend web) ou header Authorization: Bearer (API/Swagger).' })
  @ApiResponse({ status: 200, description: 'Dados do usuário autenticado.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  me(@CurrentUser() user: any) {
    return this.authService.me(user);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout com revogação do token', description: 'Invalida o JWT no Redis e limpa o cookie de sessão.' })
  @ApiResponse({ status: 204, description: 'Token revogado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Token inválido ou já revogado.' })
  async logout(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.revogarToken(user);
    res.clearCookie(COOKIE_NAME, { path: '/' });
  }
}
