import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { Auth } from '../auth/auth.decorators';
import { WeatherService } from './weather.service';

@Controller('v1')
export class WeatherController {
  constructor(private readonly weather: WeatherService) {}

  @Get('cities/:cityId/weather')
  @Auth()
  async cityWeather(
    @Param('cityId') cityId: string,
    @Query('days') daysRaw?: string,
  ) {
    const days = daysRaw ? Number(daysRaw) : 14;
    const forecast = await this.weather.getCityForecast(
      cityId,
      Number.isFinite(days) ? days : 14,
    );
    if (!forecast) {
      throw new NotFoundException('Weather unavailable for this city');
    }
    return forecast;
  }
}
