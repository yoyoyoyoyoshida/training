import { create } from 'zustand';
import type { WrongAnswer, GameQuestion } from '../types';
import type { CubeColor } from '../data/pllData';

export interface QuizResult {
  score: number;
  totalQuestions: number;
  wrongAnswers: WrongAnswer[];
  completedAt: string;
}

export interface TimeAttackResult {
  totalAnswered: number;
  correctCount: number;
  wrongCount: number;
  wrongAnswers: WrongAnswer[];
  durationSeconds: number;
  colors: CubeColor[];
  completedAt: string;
}

interface SessionState {
  lastQuizResult?: QuizResult;
  lastTimeAttackResult?: TimeAttackResult;
  lastTimeAttackQuestions?: GameQuestion[];
  setQuizResult: (result: QuizResult) => void;
  setTimeAttackResult: (
    result: TimeAttackResult,
    questions: GameQuestion[],
  ) => void;
  clearReview: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  lastQuizResult: undefined,
  lastTimeAttackResult: undefined,
  lastTimeAttackQuestions: undefined,
  setQuizResult: (result) => set({ lastQuizResult: result }),
  setTimeAttackResult: (result, questions) =>
    set({ lastTimeAttackResult: result, lastTimeAttackQuestions: questions }),
  clearReview: () =>
    set({
      lastQuizResult: undefined,
      lastTimeAttackResult: undefined,
      lastTimeAttackQuestions: undefined,
    }),
}));
