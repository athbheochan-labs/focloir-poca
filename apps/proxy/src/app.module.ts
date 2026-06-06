import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ScraperModule } from './scraper/scraper.module';
import { DictionaryModule } from './dictionary/dictionary.module';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [CacheModule, HealthModule, ScraperModule, DictionaryModule],
})
export class AppModule {}
