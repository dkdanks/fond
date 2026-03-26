# Contributing

## Development

- Install dependencies with `pnpm install`
- Start the app with `pnpm dev`
- Verify important changes with `pnpm build`

## Project Conventions

This project uses a lightweight architecture guide for both humans and coding agents:

- see [AGENTS.md](/Users/daviddanks/dev/fond/AGENTS.md)

The guide is intentionally broad. It should help maintain consistency without preventing better patterns from being introduced when the codebase evolves.

## Practical Expectations

- Keep route files focused on orchestration.
- Prefer shared components over duplicated UI.
- Keep feature-specific code grouped together.
- Preserve behavior unless the task explicitly requires product changes.
- Avoid reintroducing large page-level monoliths.
- Use `pnpm build` for high-impact or overlapping changes.
