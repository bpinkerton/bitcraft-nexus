# Commit Message Convention - Quick Reference

## Format
```
<type>(<scope>): <subject>
```

## Types
| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): add OAuth login` |
| `fix` | Bug fix | `fix(ui): resolve mobile menu overlap` |
| `docs` | Documentation | `docs: update API examples` |
| `style` | Code style/formatting | `style: fix indentation in utils` |
| `refactor` | Code restructuring | `refactor(api): simplify error handling` |
| `perf` | Performance improvement | `perf(db): optimize query execution` |
| `test` | Add/update tests | `test(auth): add login flow tests` |
| `build` | Build system/dependencies | `build: update webpack config` |
| `ci` | CI/CD changes | `ci: add GitHub Actions workflow` |
| `chore` | Maintenance tasks | `chore(deps): update dependencies` |
| `revert` | Revert previous commit | `revert: undo feature X` |

## Common Scopes
- `auth` - Authentication/authorization
- `ui` - User interface components
- `api` - API endpoints and logic
- `db` - Database operations
- `config` - Configuration files
- `deps` - Dependencies

## Examples

✅ **Good commits:**
```
feat(auth): add password reset functionality
fix(ui): resolve button alignment issue on mobile devices
docs: update installation instructions in README
refactor(api): simplify user authentication logic
chore(deps): upgrade Next.js to v15.3.1
```

❌ **Bad commits:**
```
Fixed stuff
WIP
update
Added new feature
bug fix
```

## Breaking Changes
Add `!` after type/scope or include `BREAKING CHANGE:` in footer:
```
feat(api)!: change authentication endpoint

BREAKING CHANGE: Auth endpoint now requires OAuth token
```

## Tips
- Use imperative mood: "add" not "added" or "adds"
- Don't capitalize first letter of subject
- No period at the end of subject
- Keep subject under 50 characters
- Use body to explain *what* and *why*, not *how*

