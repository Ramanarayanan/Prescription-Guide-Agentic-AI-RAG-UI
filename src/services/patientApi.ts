import type {

  PatientRecord,
  StoreRequest,
  StoreResponse,
  AnalyzeRequest,
  AnalyzeResponse

} from '../types/patient';
import { apiGet, apiPost } from './apiClient';

export function storePatient(body: StoreRequest): Promise<StoreResponse> {
  return apiPost<StoreResponse>('/store', body);
}

export function getPatientDetails(name: string, dob: string): Promise<PatientRecord> {
  return apiGet<PatientRecord>('/patient-details', { name, dob });
}

export async function analyzeMedication(name: string, body: AnalyzeRequest): Promise<string> {
  const response = await apiPost<AnalyzeResponse>(`/analyze/${encodeURIComponent(name)}`, body);
  return response.result;
}

export function searchPatientsByName(name: string): Promise<PatientRecord[]> {
  return apiGet<PatientRecord[]>('/patients', { name });
}
