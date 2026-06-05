import { Module } from '@nestjs/common';
import { TeanglannController } from './teanglann.controller';
import { TeanglannService } from './teanglann.service';

@Module({
  controllers: [TeanglannController],
  providers: [TeanglannService],
})
export class ScraperModule {}
