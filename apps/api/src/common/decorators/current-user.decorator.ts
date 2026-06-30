import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../types/auth.types';

/**
 * Wyciąga zalogowanego użytkownika (lub jego pojedyncze pole) z requestu.
 * Użycie: `@CurrentUser() user: AuthUser` albo `@CurrentUser('userId') id: string`.
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    return field ? user?.[field] : user;
  },
);
