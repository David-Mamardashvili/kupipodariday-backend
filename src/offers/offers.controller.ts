import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  createOffer(@Body() dto: CreateOfferDto, @Request() req) {
    return this.offersService.createOffer(dto, req.user);
  }

  @Get()
  findAllOffers() {
    return this.offersService.findAllOffers();
  }

  @Get(':id')
  findOffer(@Param('id') id: string) {
    return this.offersService.findOffer({ id: +id });
  }
}
