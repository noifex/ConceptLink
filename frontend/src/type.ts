export type Word = {
  id: number;
  word: string;
  language: string;
  ipa?: string;
  nuance?: string;
};

export type Concept = {
  id: number;
  name: string;
  notes: string;
  words?: Word[];
};