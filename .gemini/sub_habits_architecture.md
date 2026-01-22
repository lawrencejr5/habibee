# Sub-Habits Architecture Diagram

## Database Schema Relationship

```
┌─────────────────────────────────────┐
│           users                      │
│  ─────────────────────────────────  │
│  _id: Id<"users">                   │
│  email: string                       │
│  fullname: string                    │
│  streak: number                      │
│  ...                                 │
└──────────────┬──────────────────────┘
               │
               │ (one-to-many)
               │
               ▼
┌─────────────────────────────────────┐
│           habits                     │
│  ─────────────────────────────────  │
│  _id: Id<"habits">                  │
│  user: Id<"users">                  │◄────┐
│  habit: string                       │     │
│  duration: number?                   │     │
│  goal: number                        │     │
│  current_streak: number              │     │
│  highest_streak: number              │     │
│  ...                                 │     │
└──────────────┬──────────────────────┘     │
               │                             │
               │ (one-to-many)               │
               │                             │
               ▼                             │
┌─────────────────────────────────────┐     │
│         sub_habits                   │     │
│  ─────────────────────────────────  │     │
│  _id: Id<"sub_habits">              │     │
│  parent_habit: Id<"habits">         │─────┘
│  name: string                        │
│  completed: boolean                  │
└─────────────────────────────────────┘
```

## API Function Flow

### Creating Sub-Habits

```
Frontend                    Backend (Convex)                Database
   │                              │                            │
   │  add_sub_habit()            │                            │
   ├─────────────────────────────►                            │
   │  { parent_habit_id, name }  │                            │
   │                              │                            │
   │                              │  1. Authenticate user      │
   │                              │  2. Verify parent habit    │
   │                              │  3. Check duplicates       │
   │                              │                            │
   │                              │  INSERT sub_habit          │
   │                              ├───────────────────────────►│
   │                              │                            │
   │  ◄─────────────────────────  │  ◄─────────────────────── │
   │  sub_habit_id               │  sub_habit_id              │
   │                              │                            │
```

### Toggling Sub-Habit Completion

```
Frontend                    Backend (Convex)                Database
   │                              │                            │
   │  toggle_sub_habit()         │                            │
   ├─────────────────────────────►                            │
   │  { sub_habit_id }           │                            │
   │                              │                            │
   │                              │  1. Authenticate user      │
   │                              │  2. Get sub_habit          │
   │                              │  3. Verify ownership       │
   │                              │                            │
   │                              │  PATCH sub_habit           │
   │                              │  completed = !completed    │
   │                              ├───────────────────────────►│
   │                              │                            │
   │  ◄─────────────────────────  │  ◄─────────────────────── │
   │  { completed: true }        │  success                   │
   │                              │                            │
```

### Completing Habit with Sub-Habits

```
Frontend                    Backend (Convex)                Database
   │                              │                            │
   │  record_streak()            │                            │
   ├─────────────────────────────►                            │
   │  { habit_id, date, ... }    │                            │
   │                              │                            │
   │                              │  1. Authenticate user      │
   │                              │  2. Check if already done  │
   │                              │                            │
   │                              │  QUERY sub_habits          │
   │                              ├───────────────────────────►│
   │                              │  ◄─────────────────────── │
   │                              │  [sub_habits]              │
   │                              │                            │
   │                              │  3. Verify all completed   │
   │                              │     ├─ YES: Continue       │
   │                              │     └─ NO: Throw error     │
   │                              │                            │
   │                              │  INSERT habit_entry        │
   │                              ├───────────────────────────►│
   │                              │                            │
   │                              │  PATCH habit (streak++)    │
   │                              ├───────────────────────────►│
   │                              │                            │
   │                              │  PATCH all sub_habits      │
   │                              │  (reset completed=false)   │
   │                              ├───────────────────────────►│
   │                              │                            │
   │  ◄─────────────────────────  │  ◄─────────────────────── │
   │  success                    │  success                   │
   │                              │                            │
```

## State Machine: Sub-Habit Completion Flow

```
                    ┌─────────────────┐
                    │  Habit Created  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Add Sub-Habits │
                    └────────┬────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │  All Sub-Habits: completed = false     │
        │  State: INCOMPLETE                     │
        └────────┬───────────────────────────────┘
                 │
                 │ User toggles sub-habits
                 │
                 ▼
        ┌────────────────────────────────────────┐
        │  Some Sub-Habits: completed = true     │
        │  State: PARTIAL                        │
        └────────┬───────────────────────────────┘
                 │
                 │ User completes remaining
                 │
                 ▼
        ┌────────────────────────────────────────┐
        │  All Sub-Habits: completed = true      │
        │  State: READY_TO_COMPLETE              │
        └────────┬───────────────────────────────┘
                 │
                 │ User clicks "Complete Habit"
                 │
                 ▼
        ┌────────────────────────────────────────┐
        │  record_streak() called                │
        │  - Verifies all completed              │
        │  - Records streak                      │
        │  - Resets all to completed = false     │
        └────────┬───────────────────────────────┘
                 │
                 │ Next day
                 │
                 ▼
        ┌────────────────────────────────────────┐
        │  All Sub-Habits: completed = false     │
        │  State: INCOMPLETE (cycle repeats)     │
        └────────────────────────────────────────┘
```

## Component Hierarchy (Recommended)

```
App
 │
 ├─ HabitsScreen
 │   │
 │   ├─ HabitCard (for each habit)
 │   │   │
 │   │   ├─ HabitHeader
 │   │   │   ├─ Icon
 │   │   │   ├─ Name
 │   │   │   └─ Streak
 │   │   │
 │   │   ├─ SubHabitsSection (if has sub-habits)
 │   │   │   │
 │   │   │   ├─ SubHabitsProgress
 │   │   │   │   ├─ ProgressBar
 │   │   │   │   └─ ProgressText (e.g., "2/5")
 │   │   │   │
 │   │   │   └─ SubHabitsList
 │   │   │       └─ SubHabitItem (for each sub-habit)
 │   │   │           ├─ Checkbox
 │   │   │           ├─ Name
 │   │   │           └─ DeleteButton
 │   │   │
 │   │   ├─ AddSubHabitButton
 │   │   │
 │   │   └─ CompleteHabitButton
 │   │       └─ (disabled if sub-habits incomplete)
 │   │
 │   └─ AddHabitButton
 │
 └─ Modals
     │
     ├─ AddSubHabitModal
     │   ├─ TextInput (sub-habit name)
     │   └─ SubmitButton
     │
     └─ HabitDetailsModal
         ├─ Habit Info
         ├─ Sub-Habits Management
         └─ Edit/Delete Options
```

## Data Flow: User Interaction

```
┌─────────────────────────────────────────────────────────┐
│  User opens app                                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  useQuery(api.habits.get_user_habits)                   │
│  → Fetches all habits                                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  For each habit with sub-habits:                        │
│  useQuery(api.sub_habits.get_sub_habits, { habit_id })  │
│  → Fetches sub-habits                                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Display habits with sub-habit checkboxes               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  User clicks checkbox                                   │
│  → useMutation(api.sub_habits.toggle_sub_habit)         │
│  → Sub-habit.completed toggled                          │
│  → UI updates reactively (Convex subscription)          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  All sub-habits completed?                              │
│  → useQuery(api.sub_habits.all_sub_habits_completed)    │
│  → Returns: true                                        │
│  → Enable "Complete Habit" button                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  User clicks "Complete Habit"                           │
│  → useMutation(api.habits.record_streak)                │
│  → Backend verifies all sub-habits completed            │
│  → Records streak                                       │
│  → Resets all sub-habits to completed = false           │
│  → UI updates with new streak count                     │
└─────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
User Action                 Validation                    Result
    │                           │                           │
    │  Add sub-habit           │                           │
    ├──────────────────────────►                           │
    │                           │  Check duplicate name    │
    │                           ├──────────┬───────────────┤
    │                           │          │               │
    │                           │      Duplicate?          │
    │                           │          │               │
    │                           │      YES │ NO            │
    │                           │          │               │
    │  ◄────────────────────────┼──────────┘               │
    │  Error: "Duplicate name"  │                          │
    │                           │                          │
    │  ◄────────────────────────┼──────────────────────────┘
    │  Success: sub_habit_id    │
    │                           │
    │  Complete habit          │
    ├──────────────────────────►
    │                           │  All sub-habits done?
    │                           ├──────────┬───────────────┤
    │                           │          │               │
    │                           │      NO  │ YES           │
    │                           │          │               │
    │  ◄────────────────────────┼──────────┘               │
    │  Error: "Complete all"    │                          │
    │                           │                          │
    │  ◄────────────────────────┼──────────────────────────┘
    │  Success: streak++        │
```
