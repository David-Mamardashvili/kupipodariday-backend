import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wish } from './entities/wish.entity';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { User } from 'src/users/entities/user.entity';
import { excludePassword } from '../utils/exclude-password';

@Injectable()
export class WishesService {
  constructor(
    @InjectRepository(Wish)
    private readonly wishRepo: Repository<Wish>,
  ) {}

  addNewWish(dto: CreateWishDto, owner: User) {
    const wish = this.wishRepo.create({ ...dto, owner });
    return this.wishRepo.save(wish);
  }

  async listAllWishes() {
    const wishes = await this.wishRepo.find({ relations: ['owner'] });
    return wishes.map((wish) => ({
      ...wish,
      owner: excludePassword(wish.owner) as User,
    }));
  }

  async getLatestWishes() {
    const wishes = await this.wishRepo.find({
      order: { createdAt: 'DESC' },
      take: 40,
      relations: ['owner'],
    });
    return wishes.map((wish) => ({
      ...wish,
      owner: excludePassword(wish.owner) as User,
    }));
  }

  async getTopWishes() {
    const wishes = await this.wishRepo.find({
      order: { copied: 'DESC' },
      take: 20,
      relations: ['owner'],
    });

    return wishes.map((wish) => ({
      ...wish,
      owner: excludePassword(wish.owner) as User,
    }));
  }

  async getWishById(id: number) {
    const wish = await this.wishRepo.findOne({
      where: { id },
      relations: ['owner', 'offers', 'offers.user'],
    });

    if (!wish) throw new NotFoundException('Подарок не найден');

    wish.owner = excludePassword(wish.owner) as User;

    wish.offers = wish.offers.map((offer) => ({
      ...offer,
      user: excludePassword(offer.user) as User,
    }));

    return wish;
  }

  async updateWish(id: number, dto: UpdateWishDto, user: User) {
    const wish = await this.wishRepo.findOne({
      where: { id },
      relations: ['owner', 'offers'],
    });

    if (!wish) throw new NotFoundException('Подарок не найден');

    if (wish.owner.id !== user.id)
      throw new ForbiddenException('Нельзя редактировать чужой подарок');

    if (wish.offers?.length)
      throw new ForbiddenException(
        'Нельзя редактировать подарок, на который уже скинулись',
      );
    Object.assign(wish, dto);
    return this.wishRepo.save(wish);
  }

  async removeWish(id: number, user: User) {
    const wish = await this.wishRepo.findOne({
      where: { id },
      relations: ['owner', 'offers'],
    });

    if (!wish) throw new NotFoundException('Подарок не найден');

    if (wish.owner.id !== user.id)
      throw new ForbiddenException('Нельзя удалить чужой подарок');
    return this.wishRepo.delete(id);
  }

  async copyWishById(id: number, user: User) {
    const wish = await this.wishRepo.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!wish) throw new NotFoundException('Подарок не найден');

    wish.copied += 1;
    await this.wishRepo.save(wish);

    const newWish = this.wishRepo.create({
      name: wish.name,
      link: wish.link,
      image: wish.image,
      price: wish.price,
      description: wish.description,
      owner: user,
      raised: 0,
      copied: 0,
    });

    return this.wishRepo.save(newWish);
  }
}
