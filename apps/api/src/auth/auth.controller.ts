import { Body, Controller, Get, Headers, Ip, Post, Req, UseGuards } from '@nestjs/common';
import { AdminSessionGuard } from './admin-session.guard';
import { AuthService } from './auth.service';
import { AuthenticatedRequest, ChangePasswordDto, LoginDto } from './auth.types';

@Controller('auth/admin')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('login') login(@Body() body: LoginDto, @Ip() ip: string, @Headers('user-agent') agent?: string) { return this.auth.login(body.login, body.password, ip, agent); }
  @Get('me') @UseGuards(AdminSessionGuard) me(@Req() req: AuthenticatedRequest) { return req.admin; }
  @Post('logout') @UseGuards(AdminSessionGuard) logout(@Req() req: AuthenticatedRequest) { return this.auth.logout(req.admin!.sessionId); }
  @Post('change-password') @UseGuards(AdminSessionGuard) changePassword(@Req() req: AuthenticatedRequest, @Body() body: ChangePasswordDto) { return this.auth.changePassword(req.admin!.id, req.admin!.sessionId, body.currentPassword, body.newPassword); }
}

