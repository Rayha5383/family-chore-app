import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          role: 'parent' | 'child';
          avatar_emoji: string;
          avatar_color: string;
          monthly_cap: number;
        };
      };
      chores: {
        Row: {
          id: string;
          title: string;
          description: string;
          assigned_user_id: string;
          frequency: 'daily' | 'weekly' | 'anytime';
          value: number;
          verification_type: string;
          checklist_items: string[];
          requires_before_after: boolean;
          active: boolean;
          due_time: string;
          week_days: number[];
          created_at: string;
        };
      };
      chore_instances: {
        Row: {
          id: string;
          chore_id: string;
          assigned_user_id: string;
          due_date: string;
          status: string;
          created_at: string;
        };
      };
      proofs: {
        Row: {
          id: string;
          instance_id: string;
          user_id: string;
          photo_before: string | null;
          photo_after: string | null;
          checklist_done: string[];
          submitted_at: string;
          reviewed_at: string | null;
          reviewer_note: string | null;
        };
      };
    };
  };
};
