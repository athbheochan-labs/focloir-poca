import { Injectable } from '@nestjs/common';
import { TeanglannService } from '../scraper/teanglann.service';
import { FocloirService } from '../scraper/focloir.service';
import type { TeanglannEntry } from '../scraper/teanglann.types';
import type { FocloirEntry } from '../scraper/focloir.types';

export interface LookupResult {
  word: string;
  teanglann: TeanglannEntry | null;
  focloir: FocloirEntry | null;
  errors: { source: string; message: string }[];
}

@Injectable()
export class DictionaryService {
  constructor(
    private readonly teanglannService: TeanglannService,
    private readonly focloirService: FocloirService,
  ) {}

  async lookup(word: string): Promise<LookupResult> {
    const [teanglannResult, focloirResult] = await Promise.allSettled([
      this.teanglannService.scrape(word),
      this.focloirService.scrape(word),
    ]);

    const errors: { source: string; message: string }[] = [];

    const teanglann =
      teanglannResult.status === 'fulfilled' ? teanglannResult.value : null;
    if (teanglannResult.status === 'rejected') {
      errors.push({ source: 'teanglann', message: teanglannResult.reason?.message ?? 'Unknown error' });
    }

    const focloir =
      focloirResult.status === 'fulfilled' ? focloirResult.value : null;
    if (focloirResult.status === 'rejected') {
      errors.push({ source: 'focloir', message: focloirResult.reason?.message ?? 'Unknown error' });
    }

    return { word, teanglann, focloir, errors };
  }
}
