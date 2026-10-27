# Contributing

Thanks for helping. Keep changes small and focused.

## Before opening a pull request

```sh
npx tsc --noEmit
npm run lint
npm test
```

## Conventions

- Logic that doesn't need Raycast goes in plain modules (`ics.ts`, `schedule.ts`, `prayer.ts`) with tests beside them.
- Test names start with `should`, and describe behaviour rather than implementation.
- Use Bilal's wording: jama'ah, athan, "Time to go".
- Never commit a real calendar link. It identifies your mosque and prayers.

## Screenshots

Store screenshots live in `metadata/` at 2000×1250. Capture them with Raycast's Window Capture while running `npm run dev`.
