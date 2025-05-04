import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { User } from '../users/entities/user.entity';
import { Wish } from '../wishes/entities/wish.entity';
import { excludePassword } from '../utils/exclude-password';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    @InjectRepository(Wish)
    private readonly wishRepo: Repository<Wish>,
  ) {}

  async createOffer(dto: CreateOfferDto, user: User) {
    const wish = await this.wishRepo.findOne({
      where: { id: dto.itemId },
      relations: ['owner', 'offers'],
    });

    if (!wish) {
      throw new NotFoundException('Подарок не найден');
    }

    if (wish.owner.id === user.id) {
      throw new ForbiddenException('Нельзя скидываться на свой подарок');
    }

    if (Number(wish.raised) + Number(dto.amount) > Number(wish.price)) {
      throw new BadRequestException('Нельзя превысить стоимость подарка');
    }

    wish.raised = Number(wish.raised) + Number(dto.amount);
    await this.wishRepo.save(wish);

    const offer = this.offerRepo.create({
      amount: dto.amount,
      hidden: dto.hidden,
      user,
      item: wish,
    });

    const savedOffer = await this.offerRepo.save(offer);

    if (savedOffer.item?.owner) {
      savedOffer.item.owner = excludePassword(savedOffer.item.owner) as User;
    }

    return savedOffer;
  }

  async findOffer(condition: Partial<Offer>) {
    return this.offerRepo.findOne({
      where: condition,
      relations: ['user', 'item', 'item.owner'],
    });
  }

  async findAllOffers() {
    const offers = await this.offerRepo.find({
      relations: ['user', 'item', 'item.owner'],
    });

    return offers.map((offer) => {
      const cleanOffer = {
        ...offer,
        user: excludePassword(offer.user) as User,
      };

      if (offer.item?.owner) {
        cleanOffer.item.owner = excludePassword(offer.item.owner) as User;
      }

      return cleanOffer;
    });
  }

  async updateOffer(condition: Partial<Offer>, update: Partial<Offer>) {
    return this.offerRepo.update(condition, update);
  }

  async removeOffer(condition: Partial<Offer>) {
    return this.offerRepo.delete(condition);
  }
}
