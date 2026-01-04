export type Word = {
  id: number;
  word: string;
  language: string;
  ipa?: string;
  nuance?: string;
};

export type Concept = {
  id: number;
  notes: string;
  words?: Word[];
};