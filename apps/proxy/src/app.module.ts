import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ScraperModule } from './scraper/scraper.module';

@Module({
  imports: [HealthModule, ScraperModule],
})
export class AppModule {}
