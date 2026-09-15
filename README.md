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

The five-tweet task was tested locally and on the live website. A test submission was checked in Supabase, confirming that the participant ID, tweet IDs, and selected labels were recorded correctly. Checks also covered Back/Next, editing, refresh recovery, and mobile use.

## Running the code

The system is currently deployed online at the **[task website](https://ruiqi-chen-0216.github.io/CSE594-Ruiqi-Chen-Assignment1/)**. It can be used directly without installing anything.

If the GSI would like to run the interface locally:

1. Install **Node.js 22.12 or later** and download or clone this repository.
2. In the project directory, copy `.env.example` to `.env.local`. The file already contains the public connection settings for this assignment's database.
3. Run:

   ```sh
   npm ci
   npm run dev
   ```

4. Open **http://127.0.0.1:8080/** in a browser.

Local runs use the same hosted database as the online system, so an internet connection is required. No new Supabase project or database setup is needed.

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
