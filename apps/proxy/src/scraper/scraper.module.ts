import { Module } from '@nestjs/common';
import { TeanglannController } from './teanglann.controller';
import { TeanglannService } from './teanglann.service';
import { FocloirController } from './focloir.controller';
import { FocloirService } from './focloir.service';

@Module({
  controllers: [TeanglannController, FocloirController],
  providers: [TeanglannService, FocloirService],
})
export class ScraperModule {}
