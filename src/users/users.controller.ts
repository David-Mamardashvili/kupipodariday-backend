import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { excludePassword } from 'src/utils/exclude-password';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Request() req) {
    return req.user;
  }

  @Patch('me')
  async updateMe(@Request() req, @Body() dto: UpdateUserDto) {
    const updated = await this.usersService.updateOne(
      { id: req.user.userId },
      dto,
    );
    return excludePassword(updated);
  }

  @Get(':username')
  async getByUsername(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return excludePassword(user);
  }

  @Post('search')
  async searchUsers(@Body('query') query: string) {
    if (!query || !query.trim()) {
      throw new NotFoundException('Запрос не может быть пустым');
    }
    const users = await this.usersService.findMany(query);

    if (users.length === 0) {
      throw new NotFoundException('Пользователи не найдены');
    }

    return users.map(excludePassword);
  }
}
