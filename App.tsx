import React, { useState, useEffect } from 'react';
import ImageUpload from './components/ImageUpload';
import AnalysisCard from './components/AnalysisCard';
import { AnalysisResult } from './types';
import { analyzeImageWithBackend, checkBackendHealth } from './services/backendService';
import { analyzeWithGemini, analyzeImageDirectly } from './services/geminiService';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isBackendActive, setIsBackendActive] = useState<boolean>(false);
  const [usedFallback, setUsedFallback] = useState<boolean>(false);

  // Poll backend health status
  useEffect(() => {
    const checkStatus = async () => {
      const active = await checkBackendHealth();
      setIsBackendActive(active);
    };

    checkStatus(); // Initial check
    const interval = setInterval(checkStatus, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleImageSelected = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setResult(null);
    setUsedFallback(false);
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setUsedFallback(false);

    try {
      let analysisResult: AnalysisResult;

      if (isBackendActive) {
        try {
          // Primary Path: Backend -> Gemini
          const cnnData = await analyzeImageWithBackend(file);
          
          // Pass file to Gemini for visual validation
          const geminiData = await analyzeWithGemini(file, cnnData.prediction, cnnData.confidence);
          
          // Calculate Average Confidence
          // cnnData.confidence is 0-100, geminiData.confidence is 0-100
          const avgConfidence = (cnnData.confidence + geminiData.confidence) / 2;

          analysisResult = {
            cnnResult: {
              ...cnnData,
              confidence: avgConfidence // Update to average for display
            },
            geminiResult: geminiData
          };
        } catch (backendErr) {
          console.warn("Backend prediction failed, attempting fallback...", backendErr);
          // Fallback Path: Gemini Direct
          analysisResult = await analyzeImageDirectly(file);
          setUsedFallback(true);
        }
      } else {
        // Direct Fallback Path (Backend known offline)
        analysisResult = await analyzeImageDirectly(file);
        setUsedFallback(true);
      }

      setResult(analysisResult);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred during analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      
      {/* Backend Status Indicator */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200">
        <span className={`relative flex h-3 w-3`}>
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isBackendActive ? 'bg-green-400' : 'bg-red-400'}`}></span>
          <span className={`relative inline-flex rounded-full h-3 w-3 ${isBackendActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
        </span>
        <span className={`text-xs font-semibold ${isBackendActive ? 'text-slate-700' : 'text-slate-400'}`}>
          Backend: {isBackendActive ? 'Active' : 'Offline'}
        </span>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
             </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI Skin Disease Detection</h1>
          <p className="text-lg text-slate-600">Upload a skin lesion image for professional AI analysis</p>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 border border-white">
          
          <ImageUpload onImageSelected={handleImageSelected} isLoading={isLoading} />

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-700">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
               </svg>
               <span className="text-sm font-medium">{error}</span>
            </div>
          )}
          
          {usedFallback && result && (
             <div className="mb-6 p-4 rounded-xl bg-yellow-50 border border-yellow-100 flex items-start gap-3 text-yellow-800">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
               </svg>
               <div className="text-sm">
                 <span className="font-bold block">Using Cloud AI Fallback</span>
                 The local backend server was unreachable. Results were generated purely by Gemini Vision AI.
               </div>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={!file || isLoading}
            className={`w-full py-4 px-6 rounded-xl flex items-center justify-center gap-2 font-semibold text-white transition-all transform active:scale-[0.98]
              ${!file || isLoading
                ? 'bg-slate-300 cursor-not-allowed' 
                : isBackendActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30'
                  : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:shadow-lg hover:shadow-orange-500/30'
              }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing Lesion...
              </>
            ) : (
              <>
                {isBackendActive ? 'Analyze Image' : 'Analyze with AI (Fallback)'}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {result && <AnalysisCard result={result} />}

        {/* Disclaimer */}
        <p className="text-center text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
          <span className="font-bold block mb-1 uppercase tracking-wide">Disclaimer</span>
          This system is for educational purposes only and is not a medical diagnosis tool. 
          Results are generated by AI and may be inaccurate. Always consult a qualified dermatologist for skin concerns.
        </p>
      </div>
    </div>
  );
}

export default App;