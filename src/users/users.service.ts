import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { excludePassword } from 'src/utils/exclude-password';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>) {
    const existingUserByEmail = await this.usersRepository.findOne({
      where: { email: userData.email },
    });
    if (existingUserByEmail) {
      throw new ConflictException(
        'Пользователь с таким email уже зарегистрирован',
      );
    }

    const existingUserByUsername = await this.usersRepository.findOne({
      where: { username: userData.username },
    });
    if (existingUserByUsername) {
      throw new ConflictException(
        'Пользователь с таким username уже зарегистрирован',
      );
    }

    const user = this.usersRepository.create(userData);
    const saved = await this.usersRepository.save(user);
    return excludePassword(saved);
  }

  async findWithPasswordByUsername(username: string) {
    return this.usersRepository.findOne({
      where: { username },
      select: ['id', 'username', 'email', 'password'],
    });
  }

  async getUserById(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['wishes'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return excludePassword(user);
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    const user = await this.getUserById(id);

    if (dto.email && dto.email !== user.email) {
      const existingEmail = await this.usersRepository.findOne({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException(
          'Пользователь с таким email уже зарегистрирован',
        );
      }
    }

    if (dto.username && dto.username !== user.username) {
      const existingUsername = await this.usersRepository.findOne({
        where: { username: dto.username },
      });
      if (existingUsername) {
        throw new ConflictException(
          'Пользователь с таким username уже зарегистрирован',
        );
      }
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    await this.usersRepository.update(id, dto);

    return this.getUserById(id);
  }

  async getUserByUsername(username: string) {
    const user = await this.usersRepository.findOne({ where: { username } });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return excludePassword(user);
  }

  async findMultipleUsers(query: string) {
    const users = await this.usersRepository.find({
      where: [
        { username: ILike(`%${query}%`) },
        { email: ILike(`%${query}%`) },
      ],
      relations: ['wishes'],
    });

    if (users.length === 0) {
      throw new NotFoundException('Пользователи не найдены');
    }

    return users.map(excludePassword);
  }
}
