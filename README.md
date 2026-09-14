# Emotion Labeling frontend

Interactive frontend preview for a five-post emotion labeling task. It uses local mock data and browser storage only. No backend or production deployment is included.

## Run locally

```sh
bun install
bun run dev
```

Open the local address printed by Vite.

## Mock data and state

- `src/lib/emotion-task.ts` contains the 60 allowed posts, random assignment, browser persistence, and mock submission.
- `src/components/emotion-labeling-app.tsx` contains the participant flow.
- Task state is stored under `emotion-labeling-task-v1` in `localStorage`.
- No ground-truth labels are included in the frontend.

## Development testing

Clear the current task: `localStorage.removeItem("emotion-labeling-task-v1"); location.reload();`

Force submission failure: `localStorage.setItem("emotion-labeling:force-submit-failure", "true");`

Restore success: `localStorage.removeItem("emotion-labeling:force-submit-failure");`

Responses remain in the current browser. A real backend and deployment still need to be added before collecting participant data.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
