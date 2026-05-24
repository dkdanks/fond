# Fond — Contributor Guidelines

This file is read by AI coding agents (Claude, Copilot, Cursor, etc.) and humans alike. Follow these rules on every change.

## Branch & PR Workflow

**Never push directly to `main`.** All changes go through a pull request, no exceptions.

1. Branch from `main`: `git checkout -b type/short-description` (e.g. `fix/rsvp-copy`, `feat/registry-images`)
2. Keep branches focused — one logical change per PR
3. Open a PR via `gh pr create` with a clear title and a brief description of what changed and why
4. Request a review from at least one teammate before merging
5. Delete the branch after merge

Branch naming: `feat/`, `fix/`, `refactor/`, `chore/`, `copy/`

## Commit Style

Follow Conventional Commits:

```
type(scope): short imperative message
```

Types: `feat`, `fix`, `refactor`, `copy`, `chore`, `style`, `docs`

- Keep messages concise, imperative mood ("add" not "added")
- Include `Co-Authored-By: Claude <noreply@anthropic.com>` when an AI agent contributes

## Working with AI Agents

Most contributors use Claude or similar tools. A few rules to keep things safe:

- **Agents must not push to `main`** — configure your agent to always create a branch
- **Agents must not force-push** or run `--no-verify`
- **One agent, one task** — don't run multiple agents touching the same files simultaneously
- **Review before merging** — treat AI-generated PRs like any other: read the diff, check for regressions
- If an agent makes a destructive suggestion (reset --hard, branch -D, drop migrations), pause and confirm manually

## Code Style

- TypeScript everywhere — no `any` unless unavoidable
- Keep components under ~300 LOC; split if clarity demands it
- No comments explaining *what* the code does — only *why* when it's non-obvious
- No speculative features or extra abstractions beyond the task at hand
- No emojis in code or copy unless the design explicitly calls for it

## Assets

- Images go in `public/images/`
- Use the Next.js `<Image>` component (not `<img>`) for all images in the app
- Optimise assets before committing — PNG/JPG should be compressed

## Testing & Verification

- Run `pnpm build` (or `npm run build`) before opening a PR to catch type errors
- For UI changes, start the dev server and verify the golden path in a browser before marking done
- Don't mark a task complete without verifying the change actually works

## Environment

- Node 20+, pnpm preferred
- Copy `.env.example` to `.env.local` for local development
- Never commit `.env.local` or any secrets
