import client from './client';
import type { PredictionResult, PredictRequest } from '../types/prediction';

export async function runPrediction(request: PredictRequest): Promise<PredictionResult> {
  const response = await client.post('/predict', request);
  return response.data;
}
