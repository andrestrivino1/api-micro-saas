import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { JwtPayload } from '../decorators/current-tenant.decorator';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<{
      method: string;
      url: string;
      user?: JwtPayload;
    }>();
    const start = Date.now();
    const tenantId = req.user?.tenantId ?? '-';

    return next.handle().pipe(
      tap({
        next: () =>
          this.logger.log(
            `${req.method} ${req.url} tenant=${tenantId} ${Date.now() - start}ms`,
          ),
        error: (err) =>
          this.logger.warn(
            `${req.method} ${req.url} tenant=${tenantId} ERR ${(err as Error).message} ${Date.now() - start}ms`,
          ),
      }),
    );
  }
}
