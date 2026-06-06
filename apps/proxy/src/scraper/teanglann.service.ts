import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import type {
  TeanglannEntry,
  Sense,
  Example,
  CompoundWord,
} from './teanglann.types';

const BASE_URL = 'https://www.teanglann.ie';

type CheerioSel = ReturnType<ReturnType<typeof cheerio.load>>;

@Injectable()
export class TeanglannService {
  async scrape(word: string): Promise<TeanglannEntry> {
    const url = `${BASE_URL}/en/fgb/${encodeURIComponent(word)}`;

    let html: string;
    try {
      const response = await axios.get<string>(url, {
        validateStatus: null,
        responseType: 'text',
        headers: { 'Accept-Language': 'en-GB,en;q=0.9' },
      });

      if (response.status === 404) {
        throw new NotFoundException(`'${word}' not found in Ó Dónaill`);
      }
      if (response.status !== 200) {
        throw new InternalServerErrorException(
          `Unexpected status ${response.status} from teanglann.ie`,
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
        `Failed to fetch teanglann.ie: ${(err as Error).message}`,
      );
    }

    return this.parse(html, word);
  }

  private parse(html: string, word: string): TeanglannEntry {
    const $ = cheerio.load(html);

    if ($('.nojoy').length && !$('.fgb.entry').length) {
      throw new NotFoundException(`'${word}' not found in Ó Dónaill`);
    }

    const entryEl = $('.fgb.entry').first();
    if (!entryEl.length) {
      throw new NotFoundException(`'${word}' not found in Ó Dónaill`);
    }

    const headword = entryEl
      .find('span.fgb.title')
      .first()
      .text()
      .replace(/[,\s]+$/, '')
      .trim();

    const partOfSpeech = this.extractPartOfSpeech($, entryEl);
    const { inflectionText, inflections } = this.extractInflections($, entryEl);
    const senses = this.extractSenses($, entryEl);
    const compoundWords = this.extractCompoundWords($);

    return { word, headword, partOfSpeech, inflectionText, inflections, senses, compoundWords };
  }

  private extractPartOfSpeech($: CheerioAPI, entry: CheerioSel): string {
    const tips: string[] = [];
    entry
      .find('span.fgb.g')
      .first()
      .find('span.fgb.tip')
      .each((_, el) => {
        const title = $(el).attr('title');
        if (title) tips.push(title);
      });
    return tips.join(', ') || entry.find('span.fgb.g').first().text().trim();
  }

  private extractInflections(
    $: CheerioAPI,
    entry: CheerioSel,
  ): { inflectionText: string; inflections: Record<string, string> } {
    const rawText = entry.text();
    const rawMatch = rawText.match(/\(([^()]+)\)/);
    const inflectionText = rawMatch ? rawMatch[1].trim() : '';

    const inflections: Record<string, string> = {};
    let parenDepth = 0;
    let inInflection = false;
    let pendingLabels: string[] = [];

    entry.contents().each((_, node) => {
      if (node.type === 'text') {
        for (const ch of (node as any).data as string) {
          if (ch === '(') {
            parenDepth++;
            if (parenDepth === 1) inInflection = true;
          } else if (ch === ')') {
            parenDepth--;
            if (parenDepth === 0) inInflection = false;
          }
        }
        return;
      }

      if (!inInflection || node.type !== 'tag') return;

      const el = $(node);

      if (el.hasClass('g')) {
        el.find('span.fgb.tip').each((_, tip) => {
          const title = $(tip).attr('title');
          if (title) pendingLabels.push(title);
        });
        return;
      }

      if (el.hasClass('b') && pendingLabels.length) {
        const value = el.text().replace(/[,\s]+$/, '').trim();
        for (const label of pendingLabels) {
          inflections[label] = value;
        }
        pendingLabels = [];
      }
    });

    return { inflectionText, inflections };
  }

  private extractSenses($: CheerioAPI, entry: CheerioSel): Sense[] {
    const senses: Sense[] = [];
    let currentSense: Sense | null = null;
    let parenDepth = 0;
    let inflectionDone = false;
    let passedTitle = false;
    // Some entries (e.g. "scoil") emit a .trans before the first sense number —
    // a general gloss rather than a sense. Save it and apply to sense 1.
    let preludeDefinition = '';

    entry.contents().each((_, node) => {
      if (node.type === 'text') {
        for (const ch of (node as any).data as string) {
          if (ch === '(') parenDepth++;
          else if (ch === ')') {
            parenDepth--;
            if (parenDepth === 0 && passedTitle) inflectionDone = true;
          }
        }
        return;
      }

      if (node.type !== 'tag') return;

      const el = $(node);

      if (el.hasClass('title')) {
        passedTitle = true;
        return;
      }

      if (!passedTitle || !inflectionDone) return;

      // Category label (e.g. "Prov", "Hist", "Toil") — use as definition fallback
      if (el.hasClass('c') && currentSense && !currentSense.definition) {
        const tip = el.find('span.fgb.tip').first();
        const label = tip.attr('title') || tip.text().trim();
        if (label) currentSense.definition = label;
        return;
      }

      // Skip grammar/layout/cross-reference spans
      if (
        el.hasClass('g') || el.hasClass('p') || el.hasClass('a') ||
        el.hasClass('v') || el.hasClass('c') || el.hasClass('k') ||
        el.hasClass('n') || el.hasClass('x') || el.hasClass('s') ||
        el.hasClass('l')
      ) return;

      // Sense number: bold-clickable whose entire trimmed text is "N."
      if (el.hasClass('b')) {
        const text = el.text().trim();
        const match = text.match(/^(\d+)\.\s*$/);
        if (match) {
          const num = parseInt(match[1], 10);
          // Carry the prelude definition into the first numbered sense
          const definition = num === 1 && preludeDefinition ? preludeDefinition : '';
          preludeDefinition = '';
          currentSense = { number: num, definition, examples: [] };
          senses.push(currentSense);
          return;
        }
      }

      // Translation → definition (wrapped in .trans)
      if (el.hasClass('trans')) {
        const text = el.find('.r').first().text().trim();
        if (!currentSense) {
          preludeDefinition = preludeDefinition || text;
        } else if (!currentSense.definition) {
          currentSense.definition = text;
        }
        return;
      }

      // Bare .r span — definition without a .trans wrapper (e.g. lámh sense 2,
      // scoil sense 2: the contextual gloss follows the sense number directly)
      if (el.hasClass('r') && currentSense && !currentSense.definition) {
        const text = el.text().trim();
        if (text) currentSense.definition = text;
        return;
      }

      // Example — may itself be a numbered sense (e.g. "2. ~ crainn," in cat)
      if (el.hasClass('example')) {
        const irish = el.find('.b, .i').first().text().trim();
        const english = el.find('.r').first().text().trim();

        const embeddedSense = irish.match(/^(\d+)\.\s*(.*)/s);
        if (embeddedSense) {
          const exampleIrish = embeddedSense[2].trim();
          currentSense = {
            number: parseInt(embeddedSense[1], 10),
            definition: english,
            examples: exampleIrish ? [{ irish: exampleIrish, english }] : [],
          };
          senses.push(currentSense);
          return;
        }

        if (!currentSense) {
          // Carry any prelude definition (e.g. "Boat." for bád) into the implicit sense
          currentSense = { number: 1, definition: preludeDefinition, examples: [] };
          preludeDefinition = '';
          senses.push(currentSense);
        }
        if (irish || english) currentSense.examples.push({ irish, english });
      }
    });

    // Entries with no sense numbers (e.g. "bád"): the prelude .trans is the only definition
    if (senses.length === 0 && preludeDefinition) {
      const examples: Example[] = [];
      entry.find('span.fgb.example').each((_, el) => {
        const ex = this.extractExample($(el) as CheerioSel);
        if (ex) examples.push(ex);
      });
      senses.push({ number: 1, definition: preludeDefinition, examples });
    }

    return senses;
  }

  private extractExample(el: CheerioSel): Example | null {
    const irish = el.find('.b, .i').first().text().trim();
    const english = el.find('.r').first().text().trim();
    if (!irish && !english) return null;
    return { irish, english };
  }

  private extractCompoundWords($: CheerioAPI): CompoundWord[] {
    const compounds: CompoundWord[] = [];
    $('.dir.obverse:not(.exacts) .partial a').each((_, el) => {
      const a = $(el);
      const word = a.text().replace(/»\s*$/, '').trim();
      const href = a.attr('href') ?? '';
      if (word) compounds.push({ word, url: `${BASE_URL}${href}` });
    });
    return compounds;
  }
}
