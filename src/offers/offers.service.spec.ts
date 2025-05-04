import { Test, TestingModule } from '@nestjs/testing';
import { OffersService } from './offers.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Offer } from './entities/offer.entity';
import { Wish } from '../wishes/entities/wish.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

const mockOfferRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockWishRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
};

describe('OffersService', () => {
  let service: OffersService;
  let offerRepository: Repository<Offer>;
  let wishRepository: Repository<Wish>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OffersService,
        {
          provide: getRepositoryToken(Offer),
          useValue: mockOfferRepository,
        },
        {
          provide: getRepositoryToken(Wish),
          useValue: mockWishRepository,
        },
      ],
    }).compile();

    service = module.get<OffersService>(OffersService);
    offerRepository = module.get<Repository<Offer>>(getRepositoryToken(Offer));
    wishRepository = module.get<Repository<Wish>>(getRepositoryToken(Wish));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException if wish not found', async () => {
    mockWishRepository.findOne.mockResolvedValue(null);
    await expect(
      service.createOffer({ itemId: 1, amount: 10, hidden: false }, {} as User),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if user tries to donate to their own wish', async () => {
    const mockUser = { id: 1 } as User;
    const mockWish = { id: 1, owner: { id: 1 } } as Wish;
    mockWishRepository.findOne.mockResolvedValue(mockWish);
    await expect(
      service.createOffer({ itemId: 1, amount: 10, hidden: false }, mockUser),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw BadRequestException if raised amount exceeds wish price', async () => {
    const mockUser = { id: 2 } as User;
    const mockWish = {
      id: 1,
      price: 100,
      raised: 90,
      owner: { id: 1 },
    } as Wish;
    mockWishRepository.findOne.mockResolvedValue(mockWish);
    await expect(
      service.createOffer({ itemId: 1, amount: 20, hidden: false }, mockUser),
    ).rejects.toThrow(BadRequestException);
  });

  it('should successfully create an offer', async () => {
    const mockUser = { id: 2 } as User;
    const mockWish = {
      id: 1,
      price: 100,
      raised: 50,
      owner: { id: 1 },
    } as Wish;
    mockWishRepository.findOne.mockResolvedValue(mockWish);
    mockOfferRepository.create.mockReturnValue({
      amount: 10,
      hidden: false,
      user: mockUser,
      item: mockWish,
    });
    mockOfferRepository.save.mockResolvedValue({
      id: 1,
      amount: 10,
      hidden: false,
      user: mockUser,
      item: mockWish,
    });

    const result = await service.createOffer(
      { itemId: 1, amount: 10, hidden: false },
      mockUser,
    );
    expect(result).toHaveProperty('id');
    expect(result.amount).toBe(10);
  });
});
