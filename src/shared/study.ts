export type StudyKind = 'flashcards' | 'quiz' | 'notebook'
export interface StudyMaterial {
  id: string; title: string; fileName: string | null; mime: string; bytes: number;
  text: string; subjectId: string | null; createdAt: number;
}
export interface Citation { sourceId: string; quote: string }
export interface Flashcard extends Citation { front: string; back: string }
export interface QuizQuestion extends Citation { question: string; options: string[]; correctIndex: number; explanation: string }
export interface NotebookSection extends Citation { heading: string; body: string }
export interface StudyContent { cards?: Flashcard[]; questions?: QuizQuestion[]; sections?: NotebookSection[] }
export interface StudyArtifact {
  id: string; title: string; kind: StudyKind; sourceIds: string[]; subjectId: string | null;
  content: StudyContent; createdAt: number; learned: number[];
}
export interface NotebookMessage { id: string; question: string; answer: string; citations: Citation[]; createdAt: number }
export interface QuizAttempt { id: string; score: number; total: number; answers: number[]; createdAt: number }
export interface StudyDetail extends StudyArtifact { sources: StudyMaterial[]; messages: NotebookMessage[]; attempts: QuizAttempt[] }
export const STUDY_LIMITS = { fileBytes: 10 * 1024 * 1024, textCharacters: 80000, sourcesPerGeneration: 4, totalSourceCharacters: 100000, pdfPages: 50 } as const
