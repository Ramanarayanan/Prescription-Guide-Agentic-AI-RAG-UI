export interface StoreRequest {
  name: string;
  dob: string;
  history: string;
  drug: string;
}

export interface StoreResponse {
  id: string;
  message: string;
}

export interface PatientRecord {
  id: string;
  name: string;
  dob: string;
  history: string;
  drug: string;
}

export interface AnalyzeRequest {
  drug: string;
}

export interface AnalyzeResponse {
  result: string;
}
