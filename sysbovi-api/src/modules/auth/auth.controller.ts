import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  loginUsuario(@Body() dto: LoginDto) {
    return this.authService.loginUsuario(dto);
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  loginAdmin(@Body() dto: LoginDto) {
    return this.authService.loginAdmin(dto);
  }
}
