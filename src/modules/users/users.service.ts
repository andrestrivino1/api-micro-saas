import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async createDemoUserForTenant(tenantId: string): Promise<User> {
    const user = this.usersRepo.create({
      tenantId,
      email: `demo+${tenantId}@grooming.local`,
      displayName: 'Usuario Demo',
      role: 'demo',
    });
    return this.usersRepo.save(user);
  }
}
