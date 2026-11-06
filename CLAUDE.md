@AGENTS.md

## Claude Code only

- Use plan mode before any change that would warrant a new ADR.
- Use the `gh` CLI to open PRs. Never run `gh pr merge`.
- Path-specific rules live in `.claude/rules/`.
- Before opening a pull request for any slice that changes what the app shows or how it builds, start it with `npm run dev`, open it in a browser, and check the page renders without errors (console and terminal). Say in the PR description what you looked at. If a browser tool is unavailable, say so in the PR description instead of implying it was checked.
