# CSE594-Ruiqi Chen-Assignment1

A five-post emotion labeling task. React + Vite serve a static page; Supabase stores each participant's five answers in one row. No login, separate API server, or local database is required.

## Current status

**Live site:** https://ruiqi-chen-0216.github.io/CSE594-Ruiqi-Chen-Assignment1/

**Source:** https://github.com/Ruiqi-Chen-0216/CSE594-Ruiqi-Chen-Assignment1

**Successful deployment:** https://github.com/Ruiqi-Chen-0216/CSE594-Ruiqi-Chen-Assignment1/actions/runs/34915742064

Local implementation and browser checks are complete. The owner's Supabase public configuration is installed in ignored `.env.local`. **One agent-operated integration test was submitted from the real local website and acknowledged by Supabase (HTTP 200, `true`); completion survived refresh.** Identical-payload retries, conflicting/invalid payload rejection and public read/update/delete denial were verified against the actual API. The owner supplied a Supabase SQL Editor screenshot: the same participant ID and all five ordered tweet/label pairs match the browser submission, with one shared database timestamp. Local cloud persistence is verified. GitHub Pages is now deployed; a separate five-answer submission from the public URL received HTTP 200 / `true` and retained completion after refresh. The administrator screenshot for that public-site submission remains pending.

| Check                                                                   | Result                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Original UI                                                             | Ran the five-post → edit → Review → simulated completion flow in headless Edge before replacing submission                                                                                                                                                                                                        |
| Dataset                                                                 | 60 fixed samples, unique source rows and `tweet_001`–`tweet_060` mapping verified; all six labels covered                                                                                                                                                                                                         |
| TypeScript / production build                                           | Passed                                                                                                                                                                                                                                                                                                            |
| ESLint                                                                  | Passed with six existing Fast Refresh warnings in shared UI components; zero errors                                                                                                                                                                                                                               |
| Browser checks                                                          | Passed on the production test build under `/CSE594-Ruiqi-Chen-Assignment1/`: two independent browser contexts, random sets, no preselection, keyboard radios, modal focus/Escape, Back, draft refresh, edit/refresh/direct return to Review, submission freeze/retry/conflict/confirmed completion, mobile layout |
| API behavior in browser tests                                           | Explicitly stubbed network failure, conflict and acknowledgement; **not evidence of database persistence**                                                                                                                                                                                                        |
| Supabase live API | Real browser submission acknowledged; exact retry succeeds; changed payload conflicts; wrong count, duplicate/unknown ID, unknown label and oversized answers rejected; public GET/PATCH/DELETE denied. Owner-supplied SQL Editor screenshot verified: all five ordered rows match the browser submission. |
| GitHub Pages | Public repository created and deployed successfully. Clean npm ci, typecheck, lint and production build passed in Actions. A real five-answer public-site submission was acknowledged by Supabase and completion survived refresh; its administrator query/screenshot is pending. |
| Lovable                                                                 | Local remote/tracking and obsolete runtime integration removed; platform-side connection has not been verified                                                                                                                                                                                                    |

The unconfigured production build was also checked before cloud configuration: it displays collection unavailability, retains all five answers, sends no submission request and never reports completion.

Private local integration-test evidence is saved under `.local-backup/`: `cloud-local-test.json`, `cloud-contract-results.json`, browser screenshots and `cloud-local-verify.sql`. The owner ran that SQL and supplied the matching five-row screenshot in the conversation. Keep the original screenshot with the assignment report; it has not been copied into public source. The test is agent-operated and must not be represented as a recruited human participant. No data was deleted to test retries.

## 1. Configure Supabase for a fresh installation

The current owner project is already configured; do not rerun the schema there. These steps are for a new independent installation.

1. Sign in at [Supabase Dashboard](https://supabase.com/dashboard) and create a project in an organization you control. Select the Free plan if appropriate. Save the database password privately; this app does not need it.
2. Wait for the project to be ready. Open **SQL Editor → New query**, paste the entire [supabase/schema.sql](supabase/schema.sql), and run it once. It creates one table, a private validator and a narrow submission function in a transaction. If a same-named object exists, stop and inspect it; do not delete existing data or rerun by dropping tables.
3. Find the **Project URL** in the project's connection/API settings, and a **publishable key** in **Settings → API Keys**. The URL looks like `https://<project-ref>.supabase.co`; the key starts with `sb_publishable_`.
4. Copy [.env.example](.env.example) to `.env.local` and replace the two placeholders. Keep `VITE_BASE_PATH=/` for local development. Never put a secret key, `service_role` key, database password, or access token in a `VITE_*` variable. This implementation deliberately accepts only the new publishable-key format.
5. Run the app using the instructions below. Environment changes require restarting Vite (and rebuilding an already built site).

The browser sends the publishable key in the `apikey` header. Database access is governed by privileges and row-level security, not secrecy of that public key. [Supabase API key documentation](https://supabase.com/docs/guides/getting-started/api-keys)

## 2. Run locally

Install Node.js 22.12 or newer (Node 22 recommended), then run in this directory:

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:8080/`. Without valid public configuration, the page clearly says collection is unavailable; it cannot silently simulate a successful submission. Local development still needs internet access for the hosted database.

```sh
npm run typecheck
npm run lint
npm run build
npm run preview
```

The static output is `dist/`. Preview's default URL is `http://localhost:4173/`. The source does not require the original private CSV at runtime.

Browser regression checks:

```sh
npx playwright install chromium
npm test
```

On Windows with Microsoft Edge installed, `$env:BROWSER_CHANNEL='msedge'` in PowerShell lets `npm test` use Edge without installing Chromium. Tests build a separate site in ignored `test-results/site/` with an explicitly fake endpoint, intercept all submission calls, and never write to Supabase. Desktop/mobile screenshots in `test-results/` are UI evidence only. The regular `dist/` build is separate.

## 3. Verify a real local submission and collect evidence

1. In the configured app, complete all five posts, optionally edit, and submit. Completion appears only after the database API returns its positive acknowledgement.
2. In that browser's developer console, read the anonymous ID and frozen submission:

   ```js
   JSON.parse(localStorage.getItem("cse594-emotion-task-live-v1"));
   ```

3. In Supabase SQL Editor, replace `PASTE_BROWSER_PARTICIPANT_UUID` below with `participantId`. Compare every `tweet_id` and `selected_label` to `submission.answers` from the browser. Take a screenshot of these **five actual database rows** for the assignment:

   ```sql
   select s.participant_id,
          a.answer->>'tweet_id' as tweet_id,
          a.answer->>'selected_label' as selected_label,
          s.submitted_at
   from public.submissions s
   cross join lateral jsonb_array_elements(s.answers)
     with ordinality as a(answer, position)
   where s.participant_id = 'PASTE_BROWSER_PARTICIPANT_UUID'::uuid
   order by a.position;
   ```

4. Check permissions from the SQL Editor. Both roles should have `false` for all four table operations; only `anon` should have `submit_allowed = true`. `rls_enabled` must be `true`:

   ```sql
   select role_name,
     has_table_privilege(role_name, 'public.submissions', 'SELECT') as can_read,
     has_table_privilege(role_name, 'public.submissions', 'INSERT') as can_insert_directly,
     has_table_privilege(role_name, 'public.submissions', 'UPDATE') as can_update,
     has_table_privilege(role_name, 'public.submissions', 'DELETE') as can_delete,
     has_function_privilege(role_name,
       'public.submit_emotion_task(uuid,jsonb,text)', 'EXECUTE') as submit_allowed
   from (values ('anon'), ('authenticated')) roles(role_name);
   select relrowsecurity as rls_enabled
   from pg_class where oid = 'public.submissions'::regclass;
   ```

5. With the project's publishable key, verify a Data API `GET /rest/v1/submissions?select=*` is denied. A valid RPC submission must work. Do not grant SELECT to resolve an error. Verify invalid/duplicate IDs, an invalid label, fewer/more than five answers and a changed payload for the same participant are rejected; resending the exact saved payload must acknowledge without changing the row count or timestamp. Live API checks for exact retry, conflict, invalid count/IDs/labels/size and public GET/PATCH/DELETE denial have now passed. The owner-supplied expanded-row screenshot now confirms five matching rows and a shared database timestamp. No separate before/after timestamp comparison was performed.

Keep real participant screenshots/exports outside the public repository, for example in the ignored `.local-backup/` folder. Do not delete valid rows to repeat a test. Use a separate browser context for an independent test participant.

## 4. Publish to GitHub Pages after cloud verification

Owner and target repository approved by the user: **Ruiqi-Chen-0216 / CSE594-Ruiqi-Chen-Assignment1**. This repository has now been created and deployed with the authenticated owner account. The following steps describe reproduction for a fresh repository; the current deployment does not need to be created again.

1. Sign in as that owner and create the intended repository without initializing an extra README. Check `git status` before staging; `.env*` (except `.env.example`), the original labeled CSV, backups and test artifacts are ignored. Preserve existing history. The former `origin` was removed, so add the new repository after it exists:

   ```sh
   git remote add origin https://github.com/Ruiqi-Chen-0216/CSE594-Ruiqi-Chen-Assignment1.git
   git add .
   git commit -m "Implement persistent five-post emotion labeling task"
   git push -u origin main
   ```

2. In repository **Settings → Secrets and variables → Actions → Variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` with the public values from step 1.
3. In **Settings → Pages**, choose **GitHub Actions** as the source.
4. In **Actions**, run **Deploy assignment to GitHub Pages** manually. The workflow checks configuration, types and lint, sets Vite's base to the actual repository name, and uploads **only `dist/`**. It has no automatic push trigger, so publishing remains an explicit final step.
5. Open the URL actually reported by the deployment. Complete another full task from that public URL; compare its five answers in the real database and take the collected-data screenshot. Local success does not establish public-site success. Update the status table above with the actual URL and results before submission.

Vite's repository base and static deployment steps follow its [official deployment guide](https://vite.dev/guide/static-deploy.html). Supabase currently lists pausing Free projects after one inactive week; check the project is active through submission and grading. No paid upgrade or keepalive was added. [Supabase pricing](https://supabase.com/pricing)

## Data and implementation notes

- [src/data/tweets.json](src/data/tweets.json) contains only IDs and frozen display text; no per-post reference labels enter the app or build.
- [data/text-review.json](data/text-review.json) records all 60 original/display pairs, source-row mappings and per-item reasons. Reference-label coverage is anger 8, fear 10, joy 13, love 8, sadness 12, surprise 9. The original `emotion_assignment_random_60.csv` is preserved locally and ignored by Git.
- Conservative preprocessing was requested by the user; it is not represented as instructor-approved. Obvious capitalization/contractions/punctuation and a few unambiguous spelling/article issues were corrected. Ambiguous fragments, missing context, negation, informal wording and emotional intensity remain. `emotion-60-reviewed-v1` identifies this frozen display dataset; do not change it once collection starts.
- [src/lib/emotion-task.ts](src/lib/emotion-task.ts) uses a browser UUID, independent Fisher–Yates sampling of five distinct posts, and saved order/answers/location/edit state. Different users can coincidentally get the same combination; there is no global uniqueness registry. Clearing storage/changing devices/shared browsers limits real-person identity. No repeated rounds are offered.
- New `cse594-emotion-*` storage keys isolate real submissions from old preview completion. The first submission freezes the ordered payload before sending. An uncertain result locks edits and allows retry of that exact payload. The server returns true only for a newly saved or exactly matching existing submission; conflicts do not overwrite data.
- [src/lib/submissions.ts](src/lib/submissions.ts) makes one `fetch` to Supabase's SQL RPC. [supabase/schema.sql](supabase/schema.sql) enables RLS, revokes direct table access, validates five distinct known IDs and six allowed labels, bounds the stored answer payload, and grants `anon` only the narrow submission function. The definer function has an empty search path and explicit object references. [Supabase function security guidance](https://supabase.com/docs/guides/database/functions)
- The original interface and shared UI utilities remain. Lovable's build plugin, SSR/router scaffolding, telemetry hooks, old favicon and Bun-specific config/lockfile were removed; `package-lock.json` is the maintained lockfile. The prior working tree and Git history are backed up locally at `.local-backup/before-implementation.zip`. The local Git disconnection does not prove Lovable's platform-side synchronization is disabled; check that project's GitHub integration separately without revoking access to other projects.

## Assignment hand-in

Follow the provided simplified brief. Include runnable source, `package.json` + `package-lock.json`, `.env.example`, SQL, this README and the 60-item text review. Supply the **verified live link and real collected-data screenshot** separately in the assignment report; the localhost database screenshot has been verified; the live link is verified and only the public-site database screenshot remains outstanding. Exclude `node_modules`, `.git`, local tools/backups, actual environment files and participant exports from public source. A1-1 is outside this implementation.

For the final public-site database screenshot, run the already prepared private `.local-backup/cloud-public-verify.sql` in Supabase SQL Editor and compare the five rows to `.local-backup/cloud-public-test.json`. The public browser review/completion screenshots are saved alongside them. These files contain integration-test evidence and are intentionally excluded from the public repository and source ZIP.
