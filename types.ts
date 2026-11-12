export interface PredictionResponse {
  prediction: string;
  confidence: number;
}

export enum GeminiVote {
  Agree = "Agree",
  Uncertain = "Uncertain",
  Disagree = "Disagree"
}

export interface GeminiAnalysis {
  explanation: string;
  vote: GeminiVote;
  recommendation: string;
  confidence: number;
}

export interface AnalysisResult {
  cnnResult: PredictionResponse;
  geminiResult: GeminiAnalysis;
}