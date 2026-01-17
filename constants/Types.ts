import { Id } from "@/convex/_generated/dataModel";

export interface HabitType {
  _id: Id<"habits">;
  habit: string;
  icon?: string;
  theme?: string;
  duration: number;
  goal: number;
  strict: boolean;
  user: Id<"users">;
  current_streak: number;
  highest_streak: number;
  lastCompleted?: string;
  timer_start_time?: number;
  timer_elapsed?: number;
}
