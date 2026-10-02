export type OpinionOption = 'SIM' | 'NAO' | 'DEPENDE' | 'NAO_SEI';

export interface Visitor {
  id: string;
  event_id?: string;
  agent_number: number;
  nickname: string;
  total_score: number;
  pre_exp_opinion?: OpinionOption;
  pre_exp_trust?: number;
  post_exp_opinion?: OpinionOption;
  post_exp_trust?: number;
  completed_stations_count: number;
  created_at?: string;
}

export interface Station {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  order_num: number;
  icon_name: string;
  description: string;
  is_active: boolean;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  label: string;
  value: string;
  order_num: number;
}

export interface Question {
  id: string;
  station_id: string;
  prompt_text: string;
  question_type: 'single_choice' | 'scale' | 'text';
  correct_option?: string;
  explanation?: string;
  xp_value: number;
  order_num: number;
  options?: QuestionOption[];
}

export interface StationResponse {
  id?: string;
  visitor_id?: string | null;
  station_id: string;
  question_id?: string | null;
  selected_option: string;
  is_correct: boolean;
  is_kiosk_vote?: boolean;
  created_at?: string;
}

export interface MediaChallenge {
  id: string;
  title: string;
  media_url: string;
  media_type: 'image' | 'video';
  is_ai_generated: boolean;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  order_num: number;
  is_active: boolean;
}

export interface Project {
  id: string;
  title: string;
  authors: string;
  problem_desc: string;
  solution_desc: string;
  ai_role: string;
  human_decision: string;
  order_num: number;
  is_active: boolean;
  reactions_count?: {
    inovador: number;
    impacto: number;
    usaria: number;
  };
}

export interface SecretCode {
  id: string;
  code_key: string;
  title: string;
  secret_content: string;
  xp_value: number;
}

export interface AggregatedStats {
  totalVisitors: number;
  totalResponses: number;
  turingAccuracy: number;
  cartAiAccuracy: number;
  hardestMediaChallenge?: {
    title: string;
    fooledPercentage: number;
  };
  ethicsDistribution: {
    sim: number;
    nao: number;
    depende: number;
  };
  preVsPost: {
    pre: { sim: number; nao: number; nao_sei: number; avgTrust: number };
    post: { sim: number; nao: number; depende: number; nao_sei: number; avgTrust: number };
  };
  topAgents: {
    nickname: string;
    total_score: number;
    agent_number: number;
    completed_stations_count?: number;
  }[];
}
