import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import type { FocloirEntry, FocloirSense, FocloirTranslation } from './focloir.types';

const BASE_URL = 'https://www.focloir.ie';

@Injectable()
export class FocloirService {
  async scrape(word: string): Promise<FocloirEntry> {
    const url = `${BASE_URL}/en/dictionary/ei/${encodeURIComponent(word)}`;

    let html: string;
    try {
      const response = await axios.get<string>(url, {
        maxRedirects: 0,
        validateStatus: null,
        responseType: 'text',
        headers: { 'Accept-Language': 'en-GB,en;q=0.9' },
      });

      // A 307 to /spellcheck/ means the word was not found
      if (
        response.status === 307 ||
        (response.status >= 300 && response.status < 400)
      ) {
        throw new NotFoundException(`'${word}' not found in NEID`);
      }
      if (response.status !== 200) {
        throw new InternalServerErrorException(
          `Unexpected status ${response.status} from focloir.ie`,
        );
      }

      html = response.data as string;
    } catch (err) {
      if (
        err instanceof NotFoundException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }
      throw new InternalServerErrorException(
        `Failed to fetch focloir.ie: ${(err as Error).message}`,
      );
    }

    return this.parse(html, word);
  }

  private parse(html: string, word: string): FocloirEntry {
    const $ = cheerio.load(html);

    const content = $('.dictionary-content');
    if (!content.length) {
      throw new NotFoundException(`'${word}' not found in NEID`);
    }

    const headword = content.find('h1.hwd').first().text().trim();
    if (!headword) {
      throw new NotFoundException(`'${word}' not found in NEID`);
    }

    const senses: FocloirSense[] = [];

    content.find('.posblk').each((_, posBlkEl) => {
      const posBlk = $(posBlkEl);
      const partOfSpeech = posBlk
        .find('> .posheader .en')
        .first()
        .text()
        .trim();

      // Each sense is either .fwksencnt (first) or .extraspace (subsequent)
      let autoNum = 0;
      posBlk.find('.fwksencnt, .extraspace').each((_, senseEl) => {
        const sense = $(senseEl);
        const rawNum = parseInt(sense.find('> .sensenum').first().text().trim(), 10);
        // Some senses (e.g. "fada") have no sensenum — auto-assign
        autoNum = isNaN(rawNum) ? autoNum + 1 : rawNum;
        const labels = this.extractLabels($, sense);
        const meaning = sense.find('> .edmeaning').first().text().trim();
        const translations = this.extractTranslations($, sense);

        // Skip phrase/phrasal-verb blocks that have neither a meaning nor translations
        if (!meaning && !translations.length && isNaN(rawNum)) return;

        senses.push({ number: autoNum, partOfSpeech, labels, meaning, translations });
      });
    });

    return { word, headword, senses };
  }

  private extractLabels($: CheerioAPI, el: ReturnType<ReturnType<typeof cheerio.load>>): string[] {
    const labels: string[] = [];
    el.find('> .labelgp').each((_, lgEl) => {
      // domain labels: .domain .en
      $(lgEl).find('.domain > .en').each((_, domEl) => {
        const text = $(domEl).text().trim();
        if (text) labels.push(text);
      });
      // eval labels: .eval > span > .en
      $(lgEl).find('.eval > span > .en').each((_, evEl) => {
        const text = $(evEl).text().trim();
        if (text) labels.push(text);
      });
    });
    return labels;
  }

  private extractTranslations(
    $: CheerioAPI,
    senseEl: ReturnType<ReturnType<typeof cheerio.load>>,
  ): FocloirTranslation[] {
    const translations: FocloirTranslation[] = [];

    // .trcnt may be a direct child or nested inside .fwkstrcnt (verb entries)
    senseEl.find('.trcnt > .trgp').each((_, trgpEl) => {
      const trgp = $(trgpEl);
      const irish = trgp.find('> .tr').first().text().trim();
      const grammar = trgp.find('> .trpos').first().attr('code') ?? null;

      const trLabels: string[] = [];
      trgp.find('> .labelgp .domain > .en').each((_, el) => {
        const text = $(el).text().trim();
        if (text) trLabels.push(text);
      });
      trgp.find('> .labelgp .eval > span > .en').each((_, el) => {
        const text = $(el).text().trim();
        if (text) trLabels.push(text);
      });

      if (irish) {
        translations.push({ irish, grammar: grammar || null, labels: trLabels });
      }
    });

    return translations;
  }
}
