import { Controller, Get, Param } from '@nestjs/common';
import { TeanglannService } from './teanglann.service';
import type { TeanglannEntry } from './teanglann.types';

@Controller('scrape/fgb')
export class TeanglannController {
  constructor(private readonly teanglannService: TeanglannService) {}

  @Get(':word')
  scrape(@Param('word') word: string): Promise<TeanglannEntry> {
    return this.teanglannService.scrape(word);
  }
}
