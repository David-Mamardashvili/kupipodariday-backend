import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('wishlists')
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Post()
  createWishlist(@Body() dto: CreateWishlistDto, @Request() req) {
    return this.wishlistsService.createWishlist(dto, req.user);
  }

  @Get()
  findAllWishlists() {
    return this.wishlistsService.findAllWishlists();
  }

  @Get(':id')
  findOneWishlist(@Param('id') id: string) {
    return this.wishlistsService.findOneWishlist(+id);
  }

  @Patch(':id')
  updateWishlist(
    @Param('id') id: string,
    @Body() dto: UpdateWishlistDto,
    @Request() req,
  ) {
    return this.wishlistsService.updateWishlist(+id, dto, req.user);
  }

  @Delete(':id')
  removeWishlist(@Param('id') id: string, @Request() req) {
    return this.wishlistsService.removeWishlist(+id, req.user);
  }
}
