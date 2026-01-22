# Sub-Habits Feature - Backend Implementation

## Overview
This document outlines the implementation of the sub-habits feature for the Habibee app. Sub-habits allow users to break down main habits into smaller, manageable tasks.

## Database Schema Changes

### New Table: `sub_habits`
Added to `convex/schema.ts`:

```typescript
sub_habits: defineTable({
  name: v.string(),
  parent_habit: v.id("habits"),
  completed: v.boolean(),
}).index("by_parent_habit", ["parent_habit"])
```

**Fields:**
- `name`: The name of the sub-habit
- `parent_habit`: Reference to the parent habit ID
- `completed`: Boolean flag indicating if the sub-habit is completed for the current day

**Index:**
- `by_parent_habit`: Allows efficient querying of all sub-habits for a given parent habit

## API Functions

### Created: `convex/sub_habits.ts`

#### Queries:
1. **`get_sub_habits`** - Get all sub-habits for a parent habit
   - Args: `parent_habit_id`
   - Returns: Array of sub-habits

2. **`has_sub_habits`** - Check if a habit has any sub-habits
   - Args: `habit_id`
   - Returns: Boolean

3. **`all_sub_habits_completed`** - Check if all sub-habits are completed
   - Args: `habit_id`
   - Returns: Boolean

#### Mutations:
1. **`add_sub_habit`** - Create a new sub-habit
   - Args: `parent_habit_id`, `name`
   - Validates: No duplicate names for the same parent
   - Returns: Sub-habit ID

2. **`toggle_sub_habit`** - Toggle completion status of a sub-habit
   - Args: `sub_habit_id`
   - Returns: New completion status

3. **`update_sub_habit`** - Rename a sub-habit
   - Args: `sub_habit_id`, `name`
   - Validates: No duplicate names for the same parent
   - Returns: Success message

4. **`delete_sub_habit`** - Delete a sub-habit
   - Args: `sub_habit_id`
   - Returns: Success message

5. **`reset_sub_habits`** - Reset all sub-habits to incomplete
   - Args: `habit_id`
   - Returns: Count of reset sub-habits

### Modified: `convex/habits.ts`

#### Updated `record_streak` mutation:
- **Before recording a streak:**
  - Checks if the habit has sub-habits
  - If yes, verifies all sub-habits are completed
  - Throws error if any sub-habit is incomplete
  
- **After recording a streak:**
  - Automatically resets all sub-habits to `completed: false`
  - This allows the user to complete them again the next day

#### Updated `delete_habit` mutation:
- **Cascade delete:**
  - When a habit is deleted, all associated sub-habits are also deleted
  - Prevents orphaned sub-habits in the database

## Business Logic

### Completion Flow:
1. User creates a habit with sub-habits
2. Each day, user must complete all sub-habits
3. Only when all sub-habits are completed can the parent habit be marked as complete
4. After successful completion, all sub-habits are reset for the next day

### Key Features:
- **Validation**: Users can only manage sub-habits for habits they own
- **Duplicate Prevention**: Sub-habit names must be unique within a parent habit
- **Automatic Reset**: Sub-habits reset after parent habit completion
- **Cascade Delete**: Deleting a parent habit removes all sub-habits

## Security
All mutations and queries include:
- Authentication check via `getAuthUserId()`
- Authorization check to ensure users can only access their own habits/sub-habits

## Next Steps (Frontend)
1. Create UI components for managing sub-habits
2. Display sub-habits in habit details modal
3. Add toggle functionality for sub-habit completion
4. Update habit completion button to check sub-habit status
5. Show visual indicators for sub-habit progress
