# Git Workflow

## Branches
- main: hamesha working code
- feature/<short-name>: naya kaam (e.g. feature/day-4-dashboard)
- fix/<short-name>: bug fixes

Har din ke liye ek feature branch, kaam khatam hone par `npm run check` pass karke main mein merge.

## Commit convention (Conventional Commits)
<type>(<scope>): <short description>

Types: feat, fix, docs, chore, test, refactor, ci
Examples:
- feat(web): add dashboard layout and upload modal
- feat(api): add auth and documents route stubs
- test(api): add health and validation tests
- docs: add git workflow
- chore: add root check script
