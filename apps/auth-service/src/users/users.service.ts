import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(
    email: string,
    passwordHash: string,
    role: UserRole = UserRole.CUSTOMER,
  ): Promise<User> {
    const user = this.usersRepository.create({ email, passwordHash, role });
    return this.usersRepository.save(user);
  }

  async getProfileOrFail(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}
