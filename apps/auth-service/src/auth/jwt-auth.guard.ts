import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Usa este guard en rutas que requieren un JWT válido. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
