import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
}

/**
 * Tabla `users` en auth_db.
 * Solo este servicio debería tocar esta tabla (database-per-service).
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  /** Hash bcrypt — nunca guardamos la contraseña en texto plano */
  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', default: UserRole.CUSTOMER })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
