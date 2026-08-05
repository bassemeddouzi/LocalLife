import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Auth, CurrentUser, AuthUser } from '../auth/auth.decorators';
import {
  AddPhotoDto,
  CreatePlaceDto,
  ListPlacesQueryDto,
  ReplacePlaceHoursDto,
  UpdatePlaceDto,
} from './dto/places.dto';
import { PlacesService } from './places.service';

@Controller('v1/places')
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  @Get()
  list(@Query() query: ListPlacesQueryDto) {
    return this.places.listPublic(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.places.getPublic(id);
  }

  @Post()
  @Auth(UserRole.ADMIN, UserRole.GUIDE)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePlaceDto) {
    return this.places.create(user, dto);
  }

  @Patch(':id')
  @Auth()
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePlaceDto,
  ) {
    return this.places.update(user, id, dto);
  }

  @Post(':id/hours')
  @Auth(UserRole.ADMIN, UserRole.GUIDE)
  replaceHours(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReplacePlaceHoursDto,
  ) {
    return this.places.replaceHours(user, id, dto.hours);
  }

  @Post(':id/photos')
  @Auth()
  addPhoto(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddPhotoDto,
  ) {
    return this.places.addPhoto(user, id, dto);
  }
}
