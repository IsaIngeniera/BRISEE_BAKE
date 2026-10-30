import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { getJwtSecret } from '../security/jwt-secret';
import { PrismaService } from '../../prisma.service';

interface AuthRequest extends Request {
  user?: Record<string, unknown>;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Inicie sesión para acceder a esta ruta');
    }

    try {
      const payload = await this.jwtService.verifyAsync<
        Record<string, unknown>
      >(token, {
        secret: getJwtSecret(),
      });
      const userId = typeof payload.sub === 'string' ? payload.sub : undefined;
      if (!userId) {
        throw new UnauthorizedException('Token inválido');
      }

      const currentUser = await this.prisma.usuario.findUnique({
        where: { id: userId },
        select: { correo: true, rol: true, estado: true },
      });

      if (!currentUser || currentUser.estado !== 'ACTIVO') {
        throw new UnauthorizedException(
          'La sesión ya no está activa. Inicie sesión nuevamente',
        );
      }

      request.user = {
        ...payload,
        correo: currentUser.correo,
        rol: currentUser.rol,
      };
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
