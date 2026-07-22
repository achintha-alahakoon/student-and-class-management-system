# TODO: Connect Edit Student Function in Admin Panel

## Backend Changes
- [x] Fix `StudentsListController.js` - `updateStudent` function:
  1. [x] Fixed field name mapping from camelCase (frontend request body) to PascalCase (database columns)
  2. [x] Added `Grade` field to the update query
  3. [x] Added `Grade` to the destructured request body

## Testing
