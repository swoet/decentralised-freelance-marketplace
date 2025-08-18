export interface Project {
  id: string;
  client_id: string;
  org_id?: string;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  status?: string;
  created_at?: string;
} 