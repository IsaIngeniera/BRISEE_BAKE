import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly requests = new Map<string, RateLimitEntry>();
  private readonly windowMs = this.readPositiveNumber(
    process.env.RATE_LIMIT_TTL,
    60_000,
  );
  private readonly limit = this.readPositiveNumber(
    process.env.RATE_LIMIT_MAX,
    100,
  );

  private readPositiveNumber(value: string | undefined, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const client = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    const key = `${client}:${request.method}:${request.path}`;
    const now = Date.now();
    const current = this.requests.get(key);

    if (!current || current.resetAt <= now) {
      this.requests.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (current.count >= this.limit) {
      throw new HttpException(
        'Demasiadas solicitudes. Intenta nuevamente más tarde.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    current.count += 1;
    return true;
  }
}
