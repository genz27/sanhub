# Repository Guidelines

## Project Structure & Module Organization
- Next.js 14 (App Router) lives under `app/`; route groups like `(auth)`, `(dashboard)`, and `admin/` map directly to pages and API handlers under `app/api/`.
- Reusable UI stays in `components/` (shadcn-style primitives in `components/ui/`, generators and layout helpers nearby). Shared logic and SDK wrappers (auth, Sora, Gemini, PicUI, DB adapters) are in `lib/`. Type definitions are in `types/`.
- Static assets belong in `public/`; Tailwind and PostCSS config sit at the repo root. Python API smoke tests and artifacts live in `tests/`.

## Build, Test, and Development Commands
- `npm run dev` — start the local dev server at `http://localhost:3000`.
- `npm run build` — production build (fails on type or lint errors).
- `npm run start` — serve the production build.
- `npm run lint` — ESLint with `eslint-config-next`; run before PRs.
- Docker: `docker-compose up -d` to run the full stack with the bundled Dockerfile. Add `--build` after dependency changes.

## Coding Style & Naming Conventions
- TypeScript-first; keep strict typing on exports from `lib/` and server actions. Prefer named exports for modules that are shared across routes.
- Components use PascalCase filenames; hooks/utilities use camelCase. Route segments use kebab-case directories per Next.js norms.
- Tailwind for styling; co-locate component styles in JSX/TSX using classNames. Avoid inline `<style>` blocks. Keep indentation at 2 spaces.
- Run `npm run lint` to honor the existing ESLint rules; address warnings rather than suppressing them.

## Testing Guidelines
- API smoke tests reside in `tests/` and use Python `requests`; run with `pytest tests/test_public_feed.py` after setting `API_BASE`/`API_KEY` (env or constants) to your target server.
- When adding new server handlers, create a paired test under `tests/` that exercises the endpoint with realistic params. Prefer lightweight fixtures over recorded responses.
- For UI logic, favor component-level tests colocated with the feature or add Playwright coverage if/when the stack gains it; keep naming `test_<feature>.py` for API tests.

## Commit & Pull Request Guidelines
- Commits in this repo favor short, imperative subjects; prefer conventional commit prefixes (`feat:`, `fix:`, `chore:`) to group history (e.g., `feat: add gemini image handler`).
- Each PR should include: a clear summary of changes, linked issue/Task if applicable, screenshots for UI-visible work, and notes on testing (commands run, environments used).
- Keep PRs scoped: one feature or fix per PR. Update docs/config samples (e.g., `.env.example`) when you add new configuration knobs.

## Security & Configuration Tips
- Copy `.env.example` to `.env.local`; never commit secrets. Set `DB_TYPE` (`sqlite` by default) plus external API keys (Sora, Gemini, PicUI) before running builds.
- Review `lib/db-adapter.ts` when switching databases; ensure Docker configs match your chosen DB and credentials.
- Use non-production keys for smoke tests; sanitize any logged payloads before sharing traces or screenshots.
