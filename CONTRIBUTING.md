# Contributing to Bitcraft Nexus

## Commit Message Guidelines

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification. All commit messages will be validated automatically using commitlint.

### Commit Message Format

Each commit message consists of a **header**, an optional **body**, and an optional **footer**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

The **header** is mandatory and must conform to the format above.

#### Type

Must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

#### Scope

The scope is optional and can be anything specifying the place of the commit change (e.g., `auth`, `ui`, `api`, etc.).

#### Subject

The subject contains a succinct description of the change:

- Use the imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize the first letter
- No dot (.) at the end

### Examples

```
feat(auth): add password reset functionality

fix(ui): resolve button alignment issue on mobile

docs: update installation instructions

refactor(api): simplify user authentication logic

chore(deps): update dependencies to latest versions
```

### Breaking Changes

Breaking changes should be indicated by a `!` after the type/scope and/or by including `BREAKING CHANGE:` in the footer:

```
feat(api)!: change authentication endpoint structure

BREAKING CHANGE: The /auth endpoint now requires a different payload structure.
```

### Validation

Commit messages are automatically validated using husky and commitlint when you make a commit. If your commit message doesn't follow the conventional format, the commit will be rejected with an error message explaining what's wrong.

To manually validate a commit message, you can use:

```bash
pnpm commitlint --edit
```

### Using the Commit Message Template (Optional)

A commit message template is provided in `.gitmessage` to help you write properly formatted commits. To use it globally for this repository:

```bash
git config commit.template .gitmessage
```

Now when you run `git commit` (without the `-m` flag), your editor will open with the template pre-filled.

### VSCode Extension

For an even better experience, we recommend installing the [Conventional Commits VSCode extension](https://marketplace.visualstudio.com/items?itemName=vivaxy.vscode-conventional-commits). This extension is already listed in `.vscode/extensions.json`, so VSCode should prompt you to install it.

