import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import type { TeanglannEntry, Sense, Example, CompoundWord } from '$lib/types';

const BASE_URL = 'https://www.teanglann.ie';

type CheerioSel = ReturnType<ReturnType<typeof cheerio.load>>;

export async function scrapeTeanglann(word: string): Promise<TeanglannEntry> {
  const url = `${BASE_URL}/en/fgb/${encodeURIComponent(word)}`;

  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en-GB,en;q=0.9' },
  });

  if (res.status === 404) throw new Error(`'${word}' not found in Ó Dónaill`);
  if (!res.ok) throw new Error(`Unexpected status ${res.status} from teanglann.ie`);

  return parse(await res.text(), word);
}

function parse(html: string, word: string): TeanglannEntry {
  const $ = cheerio.load(html);

  if ($('.nojoy').length && !$('.fgb.entry').length) {
    throw new Error(`'${word}' not found in Ó Dónaill`);
  }

  const entryEl = $('.fgb.entry').first();
  if (!entryEl.length) throw new Error(`'${word}' not found in Ó Dónaill`);

  const headword = entryEl
    .find('span.fgb.title')
    .first()
    .text()
    .replace(/[,\s]+$/, '')
    .trim();

  const partOfSpeech = extractPartOfSpeech($, entryEl);
  const { inflectionText, inflections } = extractInflections($, entryEl);
  const senses = extractSenses($, entryEl);
  const compoundWords = extractCompoundWords($);

  return { word, headword, partOfSpeech, inflectionText, inflections, senses, compoundWords };
}

function extractPartOfSpeech($: CheerioAPI, entry: CheerioSel): string {
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

function extractInflections(
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
      for (const ch of (node as unknown as { data: string }).data) {
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
      for (const label of pendingLabels) inflections[label] = value;
      pendingLabels = [];
    }
  });

  return { inflectionText, inflections };
}

function extractSenses($: CheerioAPI, entry: CheerioSel): Sense[] {
  const senses: Sense[] = [];
  let currentSense: Sense | null = null;
  let parenDepth = 0;
  let inflectionDone = false;
  let passedTitle = false;
  let preludeDefinition = '';

  entry.contents().each((_, node) => {
    if (node.type === 'text') {
      for (const ch of (node as unknown as { data: string }).data) {
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

    if (el.hasClass('title')) { passedTitle = true; return; }
    if (!passedTitle || !inflectionDone) return;

    if (el.hasClass('c') && currentSense && !currentSense.definition) {
      const tip = el.find('span.fgb.tip').first();
      const label = tip.attr('title') || tip.text().trim();
      if (label) currentSense.definition = label;
      return;
    }

    if (
      el.hasClass('g') || el.hasClass('p') || el.hasClass('a') ||
      el.hasClass('v') || el.hasClass('c') || el.hasClass('k') ||
      el.hasClass('n') || el.hasClass('x') || el.hasClass('s') ||
      el.hasClass('l')
    ) return;

    if (el.hasClass('b')) {
      const text = el.text().trim();
      const match = text.match(/^(\d+)\.\s*$/);
      if (match) {
        const num = parseInt(match[1], 10);
        const definition = num === 1 && preludeDefinition ? preludeDefinition : '';
        preludeDefinition = '';
        currentSense = { number: num, definition, examples: [] };
        senses.push(currentSense);
        return;
      }
    }

    if (el.hasClass('trans')) {
      const text = el.find('.r').first().text().trim();
      if (!currentSense) {
        preludeDefinition = preludeDefinition || text;
      } else if (!currentSense.definition) {
        currentSense.definition = text;
      }
      return;
    }

    if (el.hasClass('r') && currentSense && !currentSense.definition) {
      const text = el.text().trim();
      if (text) currentSense.definition = text;
      return;
    }

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
        currentSense = { number: 1, definition: preludeDefinition, examples: [] };
        preludeDefinition = '';
        senses.push(currentSense);
      }
      if (irish || english) currentSense.examples.push({ irish, english });
    }
  });

  if (senses.length === 0 && preludeDefinition) {
    const examples: Example[] = [];
    entry.find('span.fgb.example').each((_, el) => {
      const ex = extractExample($(el) as CheerioSel);
      if (ex) examples.push(ex);
    });
    senses.push({ number: 1, definition: preludeDefinition, examples });
  }

  return senses;
}

function extractExample(el: CheerioSel): Example | null {
  const irish = el.find('.b, .i').first().text().trim();
  const english = el.find('.r').first().text().trim();
  if (!irish && !english) return null;
  return { irish, english };
}

function extractCompoundWords($: CheerioAPI): CompoundWord[] {
  const compounds: CompoundWord[] = [];
  $('.dir.obverse:not(.exacts) .partial a').each((_, el) => {
    const a = $(el);
    const word = a.text().replace(/»\s*$/, '').trim();
    const href = a.attr('href') ?? '';
    if (word) compounds.push({ word, url: `${BASE_URL}${href}` });
  });
  return compounds;
}
