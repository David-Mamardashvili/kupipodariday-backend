import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WishesService } from './wishes.service';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('wishes')
export class WishesController {
  constructor(private readonly wishesService: WishesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  addWish(@Body() dto: CreateWishDto, @Request() req) {
    return this.wishesService.addNewWish(dto, req.user);
  }

  @Get()
  listWishes() {
    return this.wishesService.listAllWishes();
  }

  @Get('latest')
  latestWishes() {
    return this.wishesService.getLatestWishes();
  }

  @Get('top')
  topWishes() {
    return this.wishesService.getTopWishes();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getWish(@Param('id') id: string) {
    return this.wishesService.getWishById(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  modifyWish(
    @Param('id') id: string,
    @Body() dto: UpdateWishDto,
    @Request() req,
  ) {
    return this.wishesService.updateWish(+id, dto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteWish(@Param('id') id: string, @Request() req) {
    return this.wishesService.removeWish(+id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/copy')
  duplicateWish(@Param('id') id: string, @Request() req) {
    return this.wishesService.copyWishById(+id, req.user);
  }
}
