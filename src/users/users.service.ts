import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { excludePassword } from '../utils/exclude-password';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>) {
    const user = this.usersRepository.create(userData);
    const saved = await this.usersRepository.save(user);
    return excludePassword(saved);
  }

  async findOne(condition: Partial<User>) {
    const user = await this.usersRepository.findOne({ where: condition });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
  }

  async updateOne(condition: Partial<User>, update: UpdateUserDto) {
    const user = await this.findOne(condition);

    if (update.password) {
      update.password = await bcrypt.hash(update.password, 10);
    }

    Object.assign(user, update);
    return this.usersRepository.save(user);
  }

  async removeOne(condition: Partial<User>) {
    const user = await this.findOne(condition);
    return this.usersRepository.remove(user);
  }

  async findByUsername(username: string) {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findMany(query: string) {
    const users = await this.usersRepository.find({
      where: [
        { username: ILike(`%${query}%`) },
        { email: ILike(`%${query}%`) },
      ],
    });

    return users;
  }

  async findWithPasswordByUsername(username: string) {
    return this.usersRepository.findOne({
      where: { username },
      select: ['id', 'username', 'email', 'password'],
    });
  }
}
