# Agent Guide

This file is a lightweight guide for coding agents and collaborators working in this repository.

It is intentionally principle-based rather than overly prescriptive. The goal is to keep the codebase coherent without blocking better approaches as the product and architecture evolve.

## Purpose

When making changes:

- keep the app buildable
- preserve behavior unless the task explicitly asks for a behavior change
- prefer extending existing patterns over introducing parallel ones
- leave the codebase easier to change than you found it

If a better pattern than the current one is clearly warranted, use it. Just make the change in a way that is consistent, scoped, and easy to follow.

## Working Style

Prefer this order of operations:

1. Understand the existing pattern in the area you are changing.
2. Check whether a shared component/helper already exists.
3. Decide whether the new code is:
   - app-wide
   - feature-specific
   - one-off and truly local
4. Place the code at the right level.
5. Verify with the strongest practical check for the surface you touched.

## Architecture Principles

### Keep route files orchestration-focused

Page and layout files should primarily:

- load data
- own route-level state
- wire together feature components
- trigger mutations/navigation

Avoid turning route files into large JSX monoliths with deeply embedded rendering logic.

If a route starts accumulating multiple panels, editors, cards, tables, or repeated blocks, extract them into feature components.

### Put shared UI in shared places

Prefer existing shared layers before building something new:

- `src/components/ui`
- `src/components/dashboard`

If a pattern appears across multiple pages, extend a shared primitive instead of duplicating markup and styles.

Examples of shared dashboard patterns already in use:

- page shells and headers
- card surfaces
- stat cards
- empty/error states

### Keep feature code together

If UI is specific to a single feature area, keep it in a feature folder rather than in a route file.

Current examples:

- `src/components/guest-management`
- `src/components/registry`
- `src/components/website-editor`
- `src/components/new-event`

Feature-local reuse is good. Not every component needs to be global.

### Prefer composition over copy-paste

Before writing a new block of UI:

1. Check whether a shared component already exists.
2. If not, ask whether the pattern should become a shared primitive.
3. Only keep it local if it is truly specific to that feature.

Repeated code is a maintenance cost. Small wrappers and focused primitives are usually better than multiple slightly-different copies.

## Styling Guidelines

Prefer:

- shared components and props
- consistent spacing and hierarchy
- reusable states for empty/loading/error/success

Avoid:

- reintroducing one-off inline styling when an existing primitive already covers the pattern
- duplicating card/header/list-shell styles across pages
- mixing multiple approaches for the same interaction in adjacent screens without a reason

Inline styles are acceptable when:

- a component already uses them
- the style is highly local and not worth abstracting yet
- extracting it would add more noise than clarity

If the same inline pattern appears more than once, it is a candidate for consolidation.

## Data and State

Prefer:

- shared loaders/helpers for repeated auth/event ownership/data-fetch patterns
- keeping data shaping near the boundary
- keeping presentational components as dumb as practical

Avoid:

- repeating the same server/client fetch logic across routes
- burying mutation logic inside many nested UI components

## Refactors

Behavior-preserving refactors are encouraged.

When refactoring:

- keep functionality the same unless the task calls for UX/product change
- extract structure first, then polish
- avoid changing too many concerns at once
- do not reintroduce previously removed monolith patterns

If working in an area that another agent has recently improved, build on the newer structure instead of copying older route-inline code back in.

## Verification

Use the strongest reasonable verification for the scope of the change.

Typical order:

- targeted `eslint` for touched files
- `pnpm build` for shared, overlapping, or high-impact changes
- focused manual smoke testing for affected flows when relevant

Do not rely on lint alone for major work. A change that touches route structure, shared types, or app-wide behavior should usually be validated with `pnpm build`.

## Collaboration Rules

If multiple agents or contributors are working at once:

- avoid overlapping write areas when possible
- do not revert unrelated changes
- integrate with the newer shared patterns instead of bypassing them
- prefer small, clear commits over large ambiguous ones

When conflicts happen, optimize for:

- preserving working behavior
- preserving the cleaner structure
- keeping shared patterns intact

## Decision Rule

When unsure where code should go, use this heuristic:

- shared across the app: `src/components/ui` or `src/components/dashboard`
- shared within one feature: that feature folder
- route-specific wiring: the route file

## Non-Goals

This guide is not meant to:

- freeze the current architecture forever
- ban new patterns when they are genuinely better
- force abstraction too early

If you introduce a better pattern, do it clearly and consistently.

## Short Version

- Keep pages thin.
- Reuse shared UI before copying markup.
- Group feature code by feature.
- Preserve behavior during refactors.
- Run `pnpm build` for important changes.
- Leave the codebase cleaner, not just changed.
