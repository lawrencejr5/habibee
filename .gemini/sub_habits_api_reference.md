# Sub-Habits API Reference

## Quick Start Guide

### Import the API functions
```typescript
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
```

## Queries

### 1. Get Sub-Habits for a Habit
```typescript
const subHabits = useQuery(api.sub_habits.get_sub_habits, {
  parent_habit_id: habitId,
});
```
**Returns:** Array of sub-habits with `_id`, `name`, `parent_habit`, and `completed` fields

### 2. Check if Habit Has Sub-Habits
```typescript
const hasSubHabits = useQuery(api.sub_habits.has_sub_habits, {
  habit_id: habitId,
});
```
**Returns:** Boolean

### 3. Check if All Sub-Habits are Completed
```typescript
const allCompleted = useQuery(api.sub_habits.all_sub_habits_completed, {
  habit_id: habitId,
});
```
**Returns:** Boolean (false if no sub-habits exist)

## Mutations

### 1. Add a Sub-Habit
```typescript
const addSubHabit = useMutation(api.sub_habits.add_sub_habit);

// Usage
await addSubHabit({
  parent_habit_id: habitId,
  name: "Drink 8 glasses of water",
});
```
**Throws:** ConvexError if duplicate name exists

### 2. Toggle Sub-Habit Completion
```typescript
const toggleSubHabit = useMutation(api.sub_habits.toggle_sub_habit);

// Usage
await toggleSubHabit({
  sub_habit_id: subHabitId,
});
```
**Returns:** `{ completed: boolean }`

### 3. Update/Rename Sub-Habit
```typescript
const updateSubHabit = useMutation(api.sub_habits.update_sub_habit);

// Usage
await updateSubHabit({
  sub_habit_id: subHabitId,
  name: "New sub-habit name",
});
```
**Throws:** ConvexError if duplicate name exists

### 4. Delete Sub-Habit
```typescript
const deleteSubHabit = useMutation(api.sub_habits.delete_sub_habit);

// Usage
await deleteSubHabit({
  sub_habit_id: subHabitId,
});
```

### 5. Reset All Sub-Habits (Manual)
```typescript
const resetSubHabits = useMutation(api.sub_habits.reset_sub_habits);

// Usage (usually not needed as record_streak does this automatically)
await resetSubHabits({
  habit_id: habitId,
});
```

## Modified Habits API

### Record Streak (Updated)
```typescript
const recordStreak = useMutation(api.habits.record_streak);

// Usage
try {
  await recordStreak({
    habit_id: habitId,
    current_date: "2026-01-22",
    week_day: "Wednesday",
  });
} catch (error) {
  // Will throw if sub-habits exist and not all are completed
  console.error(error.message);
  // "All sub-habits must be completed before marking this habit as complete"
}
```

## Example Component Usage

```typescript
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";

function SubHabitsList({ habitId }: { habitId: Id<"habits"> }) {
  const subHabits = useQuery(api.sub_habits.get_sub_habits, {
    parent_habit_id: habitId,
  });
  const toggleSubHabit = useMutation(api.sub_habits.toggle_sub_habit);
  const deleteSubHabit = useMutation(api.sub_habits.delete_sub_habit);

  if (!subHabits) return <div>Loading...</div>;

  return (
    <div>
      {subHabits.map((subHabit) => (
        <div key={subHabit._id}>
          <input
            type="checkbox"
            checked={subHabit.completed}
            onChange={() => toggleSubHabit({ sub_habit_id: subHabit._id })}
          />
          <span>{subHabit.name}</span>
          <button onClick={() => deleteSubHabit({ sub_habit_id: subHabit._id })}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Error Handling

### Common Errors:
1. **"Unauthenticated"** - User is not logged in
2. **"Unauthorized"** - User doesn't own the habit/sub-habit
3. **"Sub-habit with same name already exists"** - Duplicate name for same parent
4. **"All sub-habits must be completed before marking this habit as complete"** - Attempted to complete habit with incomplete sub-habits

### Best Practices:
- Always wrap mutations in try-catch blocks
- Show user-friendly error messages
- Disable habit completion button if sub-habits are incomplete
- Show progress indicator (e.g., "2/5 sub-habits completed")
