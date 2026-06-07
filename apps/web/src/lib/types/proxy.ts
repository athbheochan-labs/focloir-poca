// Mirror of the NestJS proxy response shapes

export interface Example {
  irish: string;
  english: string;
}

export interface Sense {
  number: number;
  definition: string;
  examples: Example[];
}

export interface CompoundWord {
  word: string;
  url: string;
}

export interface TeanglannEntry {
  word: string;
  headword: string;
  partOfSpeech: string;
  inflectionText: string;
  inflections: Record<string, string>;
  senses: Sense[];
  compoundWords: CompoundWord[];
}

export interface FocloirTranslation {
  irish: string;
  grammar: string | null;
  labels: string[];
}

export interface FocloirSense {
  number: number;
  partOfSpeech: string;
  labels: string[];
  meaning: string;
  translations: FocloirTranslation[];
}

export interface FocloirEntry {
  word: string;
  headword: string;
  senses: FocloirSense[];
}

export interface LookupError {
  source: string;
  message: string;
}

export interface LookupResult {
  word: string;
  teanglann: TeanglannEntry | null;
  focloir: FocloirEntry | null;
  errors: LookupError[];
}
