import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: 'demo' | 'owner';
}

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    if (!request.user?.tenantId) {
      throw new Error('CurrentTenant decorator used without authenticated request');
    }
    return request.user.tenantId;
  },
);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    if (!request.user) {
      throw new Error('CurrentUser decorator used without authenticated request');
    }
    return request.user;
  },
);
