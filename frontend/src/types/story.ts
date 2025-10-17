export enum Genre {
  TERROR = "terror",
  FICCAO_CIENTIFICA = "ficcao_cientifica",
  FANTASIA = "fantasia",
  DRAMA = "drama",
  ROMANCE = "romance",
  MISTERIO = "misterio",
  SUSPENSE = "suspense",
}

export enum TargetAudience {
  INFANTIL = "infantil",
  YOUNG_ADULT = "young_adult",
  ADULTO = "adulto",
}

export enum AuthorStyle {
  ZAFON = "Carlos Ruiz Zafón",
  LOVECRAFT = "H.P. Lovecraft",
  TOLKIEN = "J.R.R. Tolkien",
  KING = "Stephen King",
  CHRISTIE = "Agatha Christie",
  ASIMOV = "Isaac Asimov",
  MACHADO = "Machado de Assis",
  CLARICE = "Clarice Lispector",
}

export interface StoryRequest {
  plot: string;
  author_style: AuthorStyle;
  genre: Genre;
  target_audience: TargetAudience;
  word_count_target?: number;
}

export interface ValidationIssue {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  location: string;
  description: string;
  evidence?: string;
  suggestion: string;
}

export interface ValidationReport {
  status: "PASSED" | "FAILED";
  overall_score: number;
  issues: ValidationIssue[];
  summary: {
    total_issues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  unresolved_threads?: string[];
}

export interface CritiqueScores {
  prose_quality: number;
  character_development: number;
  narrative_structure: number;
  style_adherence: number;
  emotional_impact: number;
  originality: number;
}

export interface CritiqueReport {
  scores: CritiqueScores;
  average_score: number;
  min_score: number;
  pass_threshold: number;
  overall_assessment: "PASSED" | "FAILED";
  detailed_feedback: Record<string, any>;
  overall_strengths: string[];
  priority_improvements: string[];
  publication_readiness: "High" | "Medium" | "Low";
  recommendation: string;
}

export interface Draft {
  version: number;
  content: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface Session {
  session_id: string;
  status: "initiated" | "planning" | "writing" | "validating" | "editing" | "completed" | "failed" | "cancelled";
  request: StoryRequest;
  created_at: string;
  updated_at: string;
  current_iteration: number;
  max_iterations: number;
  current_phase?: string;
  agents_completed: string[];
  agents_in_progress: string[];
  validation_issues: ValidationIssue[];
  critic_scores: Partial<CritiqueScores>;
  drafts: Draft[];
  final_draft: string | null;
  approved: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface WebSocketMessage {
  type: "connection" | "update" | "agent_update" | "progress" | "validation" | "broadcast" | "final" | "error";
  status?: string;
  session_id?: string;
  message?: string;
  data?: any;
  agent?: string;
  iteration?: number;
  max_iterations?: number;
  phase?: string;
  progress_percent?: number;
  validation?: ValidationReport;
  critique?: CritiqueReport;
  error?: string;
  timestamp?: number;
}

export interface AgentUpdate {
  name: string;
  status: "starting" | "running" | "completed" | "failed";
  message?: string;
  timestamp: number;
}
