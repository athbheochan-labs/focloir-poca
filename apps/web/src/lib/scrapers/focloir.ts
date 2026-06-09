import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import type { FocloirEntry, FocloirSense, FocloirTranslation } from '$lib/types/proxy';

const BASE_URL = 'https://www.focloir.ie';

export async function scrapeFocloir(word: string): Promise<FocloirEntry> {
  const url = `${BASE_URL}/en/dictionary/ei/${encodeURIComponent(word)}`;

  // Don't follow redirects: a 3xx from focloir means the word wasn't found
  // (it redirects to a spellcheck/suggestions page)
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'Accept-Language': 'en-GB,en;q=0.9' },
  });

  if (res.redirected) throw new Error(`'${word}' not found in NEID`);
  if (!res.ok) throw new Error(`Unexpected status ${res.status} from focloir.ie`);

  return parse(await res.text(), word);
}

function parse(html: string, word: string): FocloirEntry {
  const $ = cheerio.load(html);

  const content = $('.dictionary-content');
  if (!content.length) throw new Error(`'${word}' not found in NEID`);

  const headword = content.find('h1.hwd').first().text().trim();
  if (!headword) throw new Error(`'${word}' not found in NEID`);

  const senses: FocloirSense[] = [];

  content.find('.posblk').each((_, posBlkEl) => {
    const posBlk = $(posBlkEl);
    const partOfSpeech = posBlk.find('> .posheader .en').first().text().trim();

    let autoNum = 0;
    posBlk.find('.fwksencnt, .extraspace').each((_, senseEl) => {
      const sense = $(senseEl);
      const rawNum = parseInt(sense.find('> .sensenum').first().text().trim(), 10);
      autoNum = isNaN(rawNum) ? autoNum + 1 : rawNum;
      const labels = extractLabels($, sense);
      const meaning = sense.find('> .edmeaning').first().text().trim();
      const translations = extractTranslations($, sense);

      if (!meaning && !translations.length && isNaN(rawNum)) return;

      senses.push({ number: autoNum, partOfSpeech, labels, meaning, translations });
    });
  });

  return { word, headword, senses };
}

function extractLabels(
  $: CheerioAPI,
  el: ReturnType<ReturnType<typeof cheerio.load>>,
): string[] {
  const labels: string[] = [];
  el.find('> .labelgp').each((_, lgEl) => {
    $(lgEl).find('.domain > .en').each((_, domEl) => {
      const text = $(domEl).text().trim();
      if (text) labels.push(text);
    });
    $(lgEl).find('.eval > span > .en').each((_, evEl) => {
      const text = $(evEl).text().trim();
      if (text) labels.push(text);
    });
  });
  return labels;
}

function extractTranslations(
  $: CheerioAPI,
  senseEl: ReturnType<ReturnType<typeof cheerio.load>>,
): FocloirTranslation[] {
  const translations: FocloirTranslation[] = [];

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

    if (irish) translations.push({ irish, grammar: grammar || null, labels: trLabels });
  });

  return translations;
}
