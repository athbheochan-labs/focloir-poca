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
