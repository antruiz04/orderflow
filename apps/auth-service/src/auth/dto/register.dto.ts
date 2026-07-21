import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../users/user.entity';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  /** Opcional: por defecto queda customer. Útil para crear un admin en demos. */
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
