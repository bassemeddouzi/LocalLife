import { Module } from '@nestjs/common';
import { PlacesController } from './places.controller';
import { SearchController } from './search.controller';
import { PlacesService } from './places.service';

@Module({
  controllers: [PlacesController, SearchController],
  providers: [PlacesService],
  exports: [PlacesService],
})
export class PlacesModule {}
