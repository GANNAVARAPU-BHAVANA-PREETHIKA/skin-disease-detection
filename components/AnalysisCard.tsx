import React from 'react';
import { AnalysisResult, GeminiVote } from '../types';

interface AnalysisCardProps {
  result: AnalysisResult;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ result }) => {
  const { cnnResult, geminiResult } = result;

  const getVoteColor = (vote: GeminiVote) => {
    switch (vote) {
      case GeminiVote.Agree:
        return 'bg-green-100 text-green-800 border-green-200';
      case GeminiVote.Uncertain:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case GeminiVote.Disagree:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVoteDescription = (vote: GeminiVote, confidence: number) => {
    switch (vote) {
      case GeminiVote.Agree:
        return `The system has high confidence (${confidence.toFixed(1)}%). The AI validates this result as likely accurate.`;
      case GeminiVote.Uncertain:
        return `The system has moderate confidence (${confidence.toFixed(1)}%). The AI suggests treating this result with caution.`;
      case GeminiVote.Disagree:
        return `The system confidence is low (${confidence.toFixed(1)}%). The AI considers this prediction unreliable and disagrees with the diagnosis.`;
      default:
        return 'AI validation status unknown.';
    }
  };

  const getDiagnosisName = (code: string) => {
    const map: Record<string, string> = {
      'mel': 'Melanoma',
      'nv': 'Nevus',
      'bcc': 'Basal Cell Carcinoma'
    };
    return map[code.toLowerCase()] || code;
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
      {/* Header / CNN Result */}
      <div className="bg-slate-50 p-6 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Primary Diagnosis</h3>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-3xl font-bold text-slate-800 capitalize block">
              {getDiagnosisName(cnnResult.prediction)}
            </span>
            <span className="text-sm text-slate-500">Diagnosis Prediction ({cnnResult.prediction})</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right">
                <span className="block text-2xl font-bold text-blue-600">{cnnResult.confidence.toFixed(1)}%</span>
                <span className="text-xs text-slate-500 font-medium">Avg. Confidence</span>
             </div>
             <div className="h-12 w-12 rounded-full border-4 border-blue-100 flex items-center justify-center bg-white shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
             </div>
          </div>
        </div>
      </div>

      {/* Gemini Analysis */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-indigo-500">
              <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.352-.272-2.636-.759-3.804a.959.959 0 00-.229-.322.75.75 0 00-.259-.163 11.21 11.21 0 01-7.992-3.292zM12 20.547a14.25 14.25 0 01-8.25-10.797 9.715 9.715 0 006.5-2.628.75.75 0 00.174-.249.75.75 0 00.088-.306 9.715 9.715 0 006.494 2.946 14.25 14.25 0 01-4.996 11.034z" clipRule="evenodd" />
              <path d="M11.25 8.25a.75.75 0 011.5 0v3.75a.75.75 0 01-1.5 0V8.25zM12 15a.75.75 0 100-1.5.75.75 0 000 1.5z" />
            </svg>
            AI Validation
          </h3>
          <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border flex items-center gap-1 ${getVoteColor(geminiResult.vote)}`}>
            {geminiResult.vote === GeminiVote.Disagree && (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            )}
            {geminiResult.vote === GeminiVote.Agree && (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            )}
            {geminiResult.vote}
          </span>
        </div>

        {/* Validation Context */}
        <div className={`mb-5 p-3 rounded-lg border text-sm flex gap-3 ${
            geminiResult.vote === GeminiVote.Disagree 
            ? 'bg-red-50 border-red-100 text-red-700' 
            : geminiResult.vote === GeminiVote.Uncertain 
                ? 'bg-orange-50 border-orange-100 text-orange-800'
                : 'bg-green-50 border-green-100 text-green-700'
        }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="font-medium">
               {getVoteDescription(geminiResult.vote, cnnResult.confidence)}
            </p>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Detailed Explanation</h4>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
                {geminiResult.explanation}
                </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Recommendation</h4>
            <div className="flex gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div className="flex-shrink-0 mt-1">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                 </svg>
              </div>
              <p className="text-slate-600 text-sm font-medium">
                {geminiResult.recommendation}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisCard;