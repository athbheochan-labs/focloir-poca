import { Controller, Get, Param } from '@nestjs/common';
import { DictionaryService } from './dictionary.service';

@Controller('dictionary')
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @Get('lookup/:word')
  lookup(@Param('word') word: string) {
    return this.dictionaryService.lookup(word);
  }
}
