import { Module } from '@nestjs/common';
import { DictionaryController } from './dictionary.controller';
import { DictionaryService } from './dictionary.service';
import { TeanglannService } from '../scraper/teanglann.service';
import { FocloirService } from '../scraper/focloir.service';

@Module({
  controllers: [DictionaryController],
  providers: [DictionaryService, TeanglannService, FocloirService],
})
export class DictionaryModule {}
