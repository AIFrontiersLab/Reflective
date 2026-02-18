export interface User {
  id: number;
  name: string;
  created_at: string;
}

export interface Identity {
  id: number;
  name: string;
  description: string;
  user_id: number;
  created_at: string;
}

export interface Trait {
  id: number;
  name: string;
  identity_id: number;
  created_at: string;
}

export interface BehaviorLog {
  id: number;
  date: string;
  description: string;
  identity_id: number;
  alignment_score: number;
  created_at: string;
}

export interface DailyReflection {
  id: number;
  date: string;
  content: string;
  identity_id: number;
  created_at: string;
}

export interface DayAlignment {
  date: string;
  avg_score: number;
  count: number;
}

export interface AlignmentTrend {
  date: string;
  avg_alignment: number;
  behavior_count: number;
}
