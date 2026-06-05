import { Controller, Get, Param } from '@nestjs/common';
import { FocloirService } from './focloir.service';
import type { FocloirEntry } from './focloir.types';

@Controller('scrape/ei')
export class FocloirController {
  constructor(private readonly focloirService: FocloirService) {}

  @Get(':word')
  scrape(@Param('word') word: string): Promise<FocloirEntry> {
    return this.focloirService.scrape(word);
  }
}
