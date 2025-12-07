export type HabitType =
  | "pray"
  | "gym"
  | "book"
  | "code"
  | "meditate"
  | "write"
  | "water"
  | "steps"
  | "heart"
  | "brain"
  | "paint"
  | "note"
  | "save"
  | "money"
  | "default"
  | "flower";

export type ThemeType =
  | "#c5c9cc"
  | "#9b59b6"
  | "#e74c3c"
  | "#3498db"
  | "#1abc9c"
  | "#e67e22";

export interface Habit {
  id: string;
  title: string;
  duration: string;
  streak: number;
  done: boolean;
  habitType: HabitType;
  themeColor: ThemeType;
}

export const habitIcons: Record<string, any> = {
  pray: require("@/assets/icons/habit/pray.png"),
  gym: require("@/assets/icons/habit/gym.png"),
  book: require("@/assets/icons/habit/book.png"),
  code: require("@/assets/icons/habit/code.png"),
  meditate: require("@/assets/icons/habit/meditate.png"),
  write: require("@/assets/icons/habit/write.png"),
  water: require("@/assets/icons/habit/water.png"),
  steps: require("@/assets/icons/habit/steps.png"),
  heart: require("@/assets/icons/habit/heart.png"),
  brain: require("@/assets/icons/habit/brain.png"),
  paint: require("@/assets/icons/habit/paint.png"),
  note: require("@/assets/icons/habit/note.png"),
  save: require("@/assets/icons/habit/save.png"),
  money: require("@/assets/icons/habit/dollar-rise.png"),
  default: require("@/assets/icons/habit/emoji.png"),
  flower: require("@/assets/icons/habit/flower.png"),
};

export const habitsData: Habit[] = [
  {
    id: "1",
    title: "Morning Prayer",
    duration: "15 mins",
    streak: 45,
    done: true,
    habitType: "pray",
    themeColor: "#9b59b6",
  },
  {
    id: "2",
    title: "Gym Workout",
    duration: "1 hr",
    streak: 23,
    done: false,
    habitType: "gym",
    themeColor: "#e74c3c",
  },
  {
    id: "3",
    title: "Read a Book",
    duration: "30 mins",
    streak: 67,
    done: true,
    habitType: "book",
    themeColor: "#3498db",
  },
  {
    id: "4",
    title: "Code Practice",
    duration: "2 hrs",
    streak: 102,
    done: true,
    habitType: "code",
    themeColor: "#1abc9c",
  },
  {
    id: "5",
    title: "Meditation",
    duration: "20 mins",
    streak: 34,
    done: false,
    habitType: "meditate",
    themeColor: "#1abc9c",
  },
  {
    id: "6",
    title: "Journal Writing",
    duration: "15 mins",
    streak: 56,
    done: true,
    habitType: "write",
    themeColor: "#e67e22",
  },
  {
    id: "7",
    title: "Drink Water (8 glasses)",
    duration: "All day",
    streak: 89,
    done: true,
    habitType: "water",
    themeColor: "#3498db",
  },
  {
    id: "8",
    title: "10,000 Steps",
    duration: "1 hr",
    streak: 12,
    done: false,
    habitType: "steps",
    themeColor: "#e67e22",
  },
];
