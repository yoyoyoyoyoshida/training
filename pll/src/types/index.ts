import type { CubeColor, PllId } from '../data/pllData';

export interface WrongAnswer {
  correctPll: PllId;
  userAnswer: PllId;
  imagePath: string;
  questionNumber: number;
}

export interface GameQuestion {
  pll: PllId;
  imageFileName: string;
  color: CubeColor;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}
