export interface PatientRecord {
  id: string;
  date: string; // ISO String or YYYY-MM-DD format
  ptNo: string;
  serviceType: 'new' | 'followup';
  citizenId: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  birthYear: string;
  age: string;
  phone: string;
  address: string;
  underlyingDisease: string;
  chiefComplaint: string;
  ptDiagnosis: string;
  treatments: string[]; // List of selected treatment IDs (e.g., 'US', 'PMS')
  otherTreatment: string;
  fee: number;
  remarks: string;
  createdAt: string;
}

export interface SystemStats {
  totalRevenue: number;
  totalServices: number;
  newCases: number;
  followups: number;
}
