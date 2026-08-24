export type CharacterGender = 'male' | 'female';
export type MemoryProfile = 'strong' | 'normal' | 'uncertain';

export interface CharacterBrief {
  id: string;
  displayName: string;
  gender: CharacterGender;
  age: number;
  occupation: string;
  publicBackground: string[];
  privateKnowledge: string[];
  memoryNotes: string[];
  memoryProfile?: MemoryProfile;
  roleplayCues?: string[];
}
