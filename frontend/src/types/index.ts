// Shared type definitions

export interface User {
  id: string;
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  marketing_opt_in?: boolean;
  total_order_value: number;
  order_count: number;
  shipping_state?: string;
  shipping_country?: string;
  created_at?: string;
}

export interface Segment {
  id: string;
  name: string;
  description?: string;
  logical_operator: 'AND' | 'OR';
  criteria: Criterion[];
  created_at?: string;
}

export interface Criterion {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'contains';
  value: string | number;
  relative_date?: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  segment_id: string;
  flow_id?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  start_date?: string;
  start_time_of_day?: string;
  start_time?: string;
  created_at: string;
}

export interface Flow {
  id: string;
  name: string;
  segment_id: string;
  entry_condition_type: string;
  entry_condition?: string;
  created_at?: string;
}

export interface FlowStep {
  step_id?: string;
  flow_id?: string;
  step_type: 'SEND_EMAIL' | 'WAIT' | 'SEND_PUSH' | 'EXIT';
  config: Record<string, any>;
  next_step_id?: string;
  step_order: number;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  segment_description?: string;
  campaign?: any;
  explanation?: string;
}

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
export type LogicalOperator = 'AND' | 'OR';
export type CriterionOperator = 'gt' | 'lt' | 'eq' | 'contains';
