# CSE594 Assignment 1 — Emotion Annotation

**Ruiqi Chen · A1-2: Create a web interface for a labeling task**

**[Open the annotation task](https://ruiqi-chen-0216.github.io/CSE594-Ruiqi-Chen-Assignment1/)**

This repository contains my annotation system for A1-2. Participants read five randomly selected tweets and choose the emotion expressed in each one. The system records which participant labeled each tweet and the label they selected.

## Using the interface

1. Read the instructions and select **Start task**. No account or personal information is required.
2. Choose one emotion for each tweet: **anger, fear, joy, love, sadness, or surprise**. No answer is preselected, and **Next** becomes available after a choice is made.
3. Use **Back** to revisit a tweet. After the fifth tweet, review all five answers. **Edit** opens the selected tweet and returns directly to the review page.
4. Select **Submit responses**. The confirmation page appears after the database acknowledges the submission.

Refreshing preserves the assigned tweets, their order, and the answers entered so far. After submission, the same browser retains the completion page. To try the task again during evaluation, use a separate browser profile or a new private-browsing session.

## Dataset

The task uses a fixed sample of **60 tweets** from the [Emotion dataset](https://huggingface.co/datasets/dair-ai/emotion), exceeding the assignment's minimum of 50. The sample covers all six reference categories:

| Anger | Fear | Joy | Love | Sadness | Surprise |
| ----- | ---- | --- | ---- | ------- | -------- |
| 8     | 10   | 13  | 8    | 12      | 9        |

Each tweet has a stable ID from `tweet_001` to `tweet_060`. Five distinct tweets are sampled without replacement for each new task. Sampling is independent across participants rather than using the same fixed set for everyone.

I applied light text cleanup for readability: capitalization, contractions, punctuation, and clear spelling or article errors. Ambiguous fragments, informal language, negation, and emotional intensity were retained. The [text review](data/text-review.json) records every original/display pair and its editing rationale. The [display dataset](src/data/tweets.json) contains only tweet IDs and text; participants are not shown the reference labels.

## Design and recorded data

I used one tweet per page to keep the task focused, a **1 of 5** progress indicator to show the remaining work, and a review step so participants can correct choices before submission. All six emotion options have the same visual treatment. The interface supports mobile screens and keyboard navigation.

A randomly generated browser ID identifies each participant without collecting a name or email. The ID is reused in that browser. Final answers are saved to a hosted Supabase database; browser storage preserves the in-progress task.

Each submission contains:

| Field             | What it records                                   |
| ----------------- | ------------------------------------------------- |
| `participant_id`  | Anonymous browser ID                              |
| `answers`         | Five ordered `{tweet_id, selected_label}` entries |
| `dataset_version` | The version of the displayed text                 |
| `submitted_at`    | Database-generated submission time                |

One database row stores all five answers together. The array can be expanded into five annotation rows to show **who labeled which tweet with which label**. Duplicate retries acknowledge the same saved answers, while conflicting answers do not overwrite an existing submission. Public visitors cannot read, update, or delete stored responses.

## Testing

Complete five-tweet submissions were tested locally and through the live website. The local submission was checked against the Supabase SQL Editor results: the participant ID and all five ordered tweet/label pairs matched. The live-site submission also received a successful database acknowledgement, and completion remained after refresh.

Automated browser tests cover random assignment in two independent browser contexts, required choices, Back/Next, draft recovery, review/edit, keyboard controls, mobile layout, and submission failure/retry behavior. These repeatable tests use intercepted API responses. Separate checks against the hosted database verified that invalid submissions and conflicting answers are rejected and that public read/update/delete requests are denied. Type checking and the production build passed; lint reports no errors.

## Running the code

The live link above is ready to use. To run the same interface locally, install **Node.js 22.12 or later**, then run from the project directory:

```sh
npm ci
```

Copy `.env.example` to `.env.local`. It includes the public connection settings for this assignment's database; no Supabase account or database setup is needed to evaluate the interface.

```sh
npm run dev
```

Open **http://127.0.0.1:8080/**. An internet connection is required, and local runs submit to the same hosted database as the live site.

Additional commands:

```sh
npm run typecheck
npm run lint
npm run build
npm run preview
```

`build` produces the static site in `dist/`; `preview` serves it at **http://localhost:4173/**. To run the automated browser tests:

```sh
npx playwright install chromium
npm test
```

## Code organization

| File                                      | Purpose                                                |
| ----------------------------------------- | ------------------------------------------------------ |
| `src/components/emotion-labeling-app.tsx` | Instructions, labeling, review, and completion screens |
| `src/lib/emotion-task.ts`                 | Participant IDs, random sampling, and saved task state |
| `src/lib/submissions.ts`                  | Submission to the hosted database                      |
| `src/data/tweets.json`                    | The 60 displayed tweets                                |
| `data/text-review.json`                   | Original text, display text, and editing rationale     |
| `supabase/schema.sql`                     | Database table, validation, and access permissions     |
| `tests/browser.mjs`                       | Automated interface tests                              |

The frontend uses React, TypeScript, and Tailwind CSS with Vite. GitHub Pages hosts the interface, and Supabase provides persistent storage.

<details>
<summary>Recreating the database independently (optional)</summary>

For a separate installation, run `supabase/schema.sql` once in a new Supabase project's SQL Editor. Replace the URL and publishable key in `.env.local` with that project's public values, then restart the app. The submitted system already has its database configured.

To inspect a submission as the database administrator, replace the UUID below with the participant ID:

```sql
select s.participant_id,
       a.answer->>'tweet_id' as tweet_id,
       a.answer->>'selected_label' as selected_label,
       s.submitted_at
from public.submissions s
cross join lateral jsonb_array_elements(s.answers)
  with ordinality as a(answer, position)
where s.participant_id = 'PARTICIPANT_UUID'::uuid
order by a.position;
```

</details>
