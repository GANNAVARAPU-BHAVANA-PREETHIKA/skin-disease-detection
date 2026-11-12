import { PredictionResponse } from '../types';

const BASE_URL = 'http://127.0.0.1:8000';
const BACKEND_URL = `${BASE_URL}/predict`;

export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    // fast timeout to avoid hanging the UI
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    await fetch(BASE_URL, { 
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    return false;
  }
};

export const analyzeImageWithBackend = async (file: File): Promise<PredictionResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (typeof data.prediction !== 'string' || typeof data.confidence !== 'number') {
      throw new Error("Invalid response format from backend");
    }

    return {
      prediction: data.prediction,
      confidence: data.confidence
    };
  } catch (error) {
    console.error("Backend prediction failed:", error);
    // Re-throw to be handled by the UI
    throw new Error(error instanceof Error ? error.message : "Failed to connect to local backend");
  }
};