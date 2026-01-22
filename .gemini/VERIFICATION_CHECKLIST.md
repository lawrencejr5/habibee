# Sub-Habits Backend - Verification Checklist

## ✅ Files Created/Modified

- [x] `convex/schema.ts` - Added `sub_habits` table
- [x] `convex/sub_habits.ts` - Created with 8 API functions
- [x] `convex/habits.ts` - Updated `record_streak` and `delete_habit`

## 📋 Quick Verification Steps

### 1. Check Convex Dev Server
```bash
# The server should be running without errors
# Check the terminal where you ran: npx convex dev
```

**Expected:** No TypeScript errors, schema deployed successfully

### 2. Verify Schema in Convex Dashboard
1. Open your Convex dashboard
2. Navigate to "Data" section
3. Look for `sub_habits` table
4. Verify it has columns: `_id`, `_creationTime`, `name`, `parent_habit`, `completed`

### 3. Test API Functions (Optional - via Convex Dashboard)

#### Test 1: Create a Sub-Habit
```javascript
// In Convex Dashboard > Functions > sub_habits.add_sub_habit
{
  "parent_habit_id": "<your_habit_id>",
  "name": "Test Sub-Habit"
}
```
**Expected:** Returns sub-habit ID

#### Test 2: Get Sub-Habits
```javascript
// In Convex Dashboard > Functions > sub_habits.get_sub_habits
{
  "parent_habit_id": "<your_habit_id>"
}
```
**Expected:** Returns array of sub-habits

#### Test 3: Toggle Sub-Habit
```javascript
// In Convex Dashboard > Functions > sub_habits.toggle_sub_habit
{
  "sub_habit_id": "<your_sub_habit_id>"
}
```
**Expected:** Returns `{ completed: true }` or `{ completed: false }`

## 🔍 Code Review Checklist

### Schema (`convex/schema.ts`)
- [x] `sub_habits` table defined
- [x] Fields: `name` (string), `parent_habit` (Id), `completed` (boolean)
- [x] Index: `by_parent_habit` on `["parent_habit"]`

### Sub-Habits API (`convex/sub_habits.ts`)
- [x] Imports: `ConvexError`, `v`, `mutation`, `query`, `getAuthUserId`
- [x] All functions have authentication checks
- [x] All functions have authorization checks (user owns habit)
- [x] Duplicate name validation in `add_sub_habit` and `update_sub_habit`

### Habits API (`convex/habits.ts`)
- [x] `record_streak` checks for sub-habits
- [x] `record_streak` verifies all sub-habits completed
- [x] `record_streak` resets sub-habits after completion
- [x] `delete_habit` cascade deletes sub-habits

## 🧪 Manual Testing Plan (After Frontend)

### Test Case 1: Basic CRUD
1. Create a habit
2. Add 3 sub-habits to it
3. Verify all appear in the list
4. Toggle one sub-habit
5. Verify it's marked as completed
6. Delete one sub-habit
7. Verify it's removed

### Test Case 2: Completion Flow
1. Create a habit with 2 sub-habits
2. Complete only 1 sub-habit
3. Try to complete the habit
4. **Expected:** Error message
5. Complete the 2nd sub-habit
6. Complete the habit
7. **Expected:** Success, streak incremented
8. Verify all sub-habits are reset to incomplete

### Test Case 3: Duplicate Prevention
1. Create a habit
2. Add sub-habit "Morning routine"
3. Try to add another "Morning routine"
4. **Expected:** Error message

### Test Case 4: Cascade Delete
1. Create a habit with 3 sub-habits
2. Delete the habit
3. Verify all sub-habits are also deleted

### Test Case 5: Authorization
1. Create a habit as User A
2. Try to add sub-habit as User B
3. **Expected:** Unauthorized error

## 🐛 Common Issues & Solutions

### Issue: "Table 'sub_habits' not found"
**Solution:** 
- Ensure Convex dev server is running
- Check for TypeScript errors in schema.ts
- Try restarting the Convex dev server

### Issue: "Cannot find module '@/convex/_generated/api'"
**Solution:**
- Wait for Convex to regenerate types
- Check that `npx convex dev` is running
- Restart your development server

### Issue: Sub-habits not resetting after completion
**Solution:**
- Check that `record_streak` includes the reset logic
- Verify the mutation is completing successfully
- Check database to confirm sub-habits are reset

### Issue: Can complete habit without completing sub-habits
**Solution:**
- Verify `record_streak` has the sub-habits check
- Ensure the check is before the streak recording
- Check for any try-catch blocks that might be swallowing errors

## 📊 Database State to Verify

After creating a habit with sub-habits, your database should look like:

### habits table
```
{
  _id: "jd7x8y9z...",
  habit: "Stay Hydrated",
  user: "kh5m6n7p...",
  current_streak: 0,
  // ... other fields
}
```

### sub_habits table
```
[
  {
    _id: "ab1c2d3e...",
    name: "Drink water in morning",
    parent_habit: "jd7x8y9z...",
    completed: false
  },
  {
    _id: "ef4g5h6i...",
    name: "Drink water at lunch",
    parent_habit: "jd7x8y9z...",
    completed: false
  }
]
```

## ✨ Next Steps

Once verification is complete:
1. Start building the frontend UI components
2. Integrate the API functions using `useQuery` and `useMutation`
3. Test the complete user flow
4. Add animations and polish
5. Deploy to production

## 📝 Notes

- The Convex dev server should automatically pick up all changes
- All API functions are reactive - UI will update automatically when data changes
- Sub-habits are scoped to individual habits - each habit can have its own set
- The `completed` field resets daily after streak recording
