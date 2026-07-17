/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Exercise {
  id: string;
  name: string;
  gif: string;
  targetMuscles: string[];
  secondaryMuscles: string[];
  bodyParts: string[];
  equipment: string[];
  instructions: string[];
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface UserStats {
  streak: number;
  totalWorkouts: number;
  lastWorkoutDate: string | null;
}

// ── AI Coach Chat ────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'coach';
  text: string;
  isStreaming?: boolean;
}
