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
