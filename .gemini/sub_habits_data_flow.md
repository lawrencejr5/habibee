# Sub-Habits Feature - Data Flow & Business Logic

## User Journey

### 1. Creating a Habit with Sub-Habits

```
User creates habit "Stay Hydrated"
  ↓
User adds sub-habits:
  - "Drink water in morning"
  - "Drink water at lunch"
  - "Drink water in evening"
  ↓
Each sub-habit is stored with:
  - name: string
  - parent_habit: Id<"habits">
  - completed: false (default)
```

### 2. Daily Completion Flow

```
Day 1 - Morning:
  User completes "Drink water in morning"
  ↓
  toggle_sub_habit({ sub_habit_id })
  ↓
  Sub-habit.completed = true

Day 1 - Lunch:
  User completes "Drink water at lunch"
  ↓
  toggle_sub_habit({ sub_habit_id })
  ↓
  Sub-habit.completed = true

Day 1 - Evening:
  User completes "Drink water in evening"
  ↓
  toggle_sub_habit({ sub_habit_id })
  ↓
  Sub-habit.completed = true
  ↓
  All sub-habits completed! ✓

User clicks "Complete Habit"
  ↓
  record_streak({ habit_id, current_date, week_day })
  ↓
  Backend checks: all_sub_habits_completed?
  ↓
  YES → Record streak, increment counters, RESET all sub-habits
  ↓
  Sub-habits ready for Day 2
```

### 3. Incomplete Sub-Habits Flow

```
Day 2 - Morning:
  User completes "Drink water in morning"
  ↓
  Sub-habit.completed = true

User tries to complete habit (without finishing other sub-habits)
  ↓
  record_streak({ habit_id, current_date, week_day })
  ↓
  Backend checks: all_sub_habits_completed?
  ↓
  NO → Throw ConvexError
  ↓
  Frontend shows: "All sub-habits must be completed"
  ↓
  User must complete remaining sub-habits first
```

## Database State Examples

### Initial State (After Creating Habit)
```javascript
// habits table
{
  _id: "habit_123",
  habit: "Stay Hydrated",
  user: "user_456",
  current_streak: 0,
  // ... other fields
}

// sub_habits table
[
  {
    _id: "subhabit_1",
    name: "Drink water in morning",
    parent_habit: "habit_123",
    completed: false
  },
  {
    _id: "subhabit_2",
    name: "Drink water at lunch",
    parent_habit: "habit_123",
    completed: false
  },
  {
    _id: "subhabit_3",
    name: "Drink water in evening",
    parent_habit: "habit_123",
    completed: false
  }
]
```

### State After Partial Completion
```javascript
// sub_habits table
[
  {
    _id: "subhabit_1",
    name: "Drink water in morning",
    parent_habit: "habit_123",
    completed: true  // ✓ Completed
  },
  {
    _id: "subhabit_2",
    name: "Drink water at lunch",
    parent_habit: "habit_123",
    completed: true  // ✓ Completed
  },
  {
    _id: "subhabit_3",
    name: "Drink water in evening",
    parent_habit: "habit_123",
    completed: false  // ✗ Not yet completed
  }
]

// Attempting to complete habit will FAIL
// Error: "All sub-habits must be completed before marking this habit as complete"
```

### State After Full Completion
```javascript
// Before record_streak
[
  { _id: "subhabit_1", completed: true },
  { _id: "subhabit_2", completed: true },
  { _id: "subhabit_3", completed: true }
]

// record_streak is called
// ↓
// Streak is recorded
// ↓
// All sub-habits are RESET

// After record_streak
[
  { _id: "subhabit_1", completed: false },  // Reset for next day
  { _id: "subhabit_2", completed: false },  // Reset for next day
  { _id: "subhabit_3", completed: false }   // Reset for next day
]

// habits table
{
  _id: "habit_123",
  current_streak: 1,  // Incremented
  highest_streak: 1,  // Updated
  lastCompleted: "2026-01-22"  // Today's date
}
```

## Frontend Recommendations

### UI States to Handle

1. **Loading State**
   - Show skeleton while fetching sub-habits
   - `if (!subHabits) return <Skeleton />`

2. **Empty State**
   - No sub-habits exist for this habit
   - Show "Add Sub-Habit" button
   - Allow direct habit completion

3. **Partial Completion State**
   - Show progress: "2/5 sub-habits completed"
   - Disable "Complete Habit" button
   - Show which sub-habits remain

4. **All Completed State**
   - Show "All sub-habits completed! ✓"
   - Enable "Complete Habit" button
   - Visual celebration (confetti, animation, etc.)

### Suggested UI Components

```
HabitCard
  ├─ HabitHeader (name, icon, theme)
  ├─ SubHabitsProgress (if has sub-habits)
  │   ├─ ProgressBar (2/5 completed)
  │   └─ SubHabitsList
  │       └─ SubHabitItem (checkbox, name, delete)
  ├─ AddSubHabitButton
  └─ CompleteHabitButton (disabled if sub-habits incomplete)
```

### Example Progress Indicator
```typescript
function SubHabitsProgress({ habitId }: { habitId: Id<"habits"> }) {
  const subHabits = useQuery(api.sub_habits.get_sub_habits, {
    parent_habit_id: habitId,
  });

  if (!subHabits || subHabits.length === 0) return null;

  const completed = subHabits.filter(sh => sh.completed).length;
  const total = subHabits.length;
  const percentage = (completed / total) * 100;

  return (
    <div>
      <div className="progress-bar">
        <div style={{ width: `${percentage}%` }} />
      </div>
      <span>{completed}/{total} completed</span>
    </div>
  );
}
```

## Edge Cases to Handle

1. **Deleting a habit with sub-habits**
   - ✓ Already handled: Cascade delete in backend

2. **User toggles sub-habit multiple times**
   - ✓ Already handled: Toggle mutation flips boolean

3. **User tries to add duplicate sub-habit name**
   - ✓ Already handled: Backend throws ConvexError

4. **User completes habit, then tries to toggle sub-habit**
   - Sub-habits are reset after completion
   - Toggling will work for next day's tracking

5. **Habit has no duration (optional duration)**
   - Sub-habits still work the same way
   - Completion is based on sub-habit checkboxes, not timer

## Performance Considerations

- **Queries are reactive**: When a sub-habit is toggled, all components using `get_sub_habits` will re-render
- **Optimistic updates**: Consider using optimistic UI updates for better UX
- **Batch operations**: If adding multiple sub-habits, consider batching API calls

## Testing Checklist

- [ ] Create habit with sub-habits
- [ ] Toggle sub-habit completion
- [ ] Try to complete habit with incomplete sub-habits (should fail)
- [ ] Complete all sub-habits and then complete habit (should succeed)
- [ ] Verify sub-habits are reset after completion
- [ ] Delete individual sub-habit
- [ ] Delete habit with sub-habits (verify cascade delete)
- [ ] Update/rename sub-habit
- [ ] Try to add duplicate sub-habit name (should fail)
- [ ] Test with habit that has no sub-habits (should work normally)
