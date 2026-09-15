import { z } from "zod";
import tweets from "@/data/tweets.json";

export const DATASET_VERSION = "emotion-60-reviewed-v1";
export const TASK_CONFIG = {
  storageKey: "cse594-emotion-task-live-v1",
  participantKey: "cse594-emotion-participant-v1",
} as const;
export const EMOTIONS = ["anger", "fear", "joy", "love", "sadness", "surprise"] as const;
export type Emotion = (typeof EMOTIONS)[number];
export type Tweet = { id: string; text: string };
export const TWEETS: Tweet[] = tweets;

const tweetId = z.string().refine((id) => TWEETS.some((tweet) => tweet.id === id));
const answerSchema = z.object({ tweet_id: tweetId, selected_label: z.enum(EMOTIONS) }).strict();
export const submissionSchema = z
  .object({
    participant_id: z.string().uuid(),
    answers: z
      .array(answerSchema)
      .length(5)
      .refine((a) => new Set(a.map((x) => x.tweet_id)).size === 5),
    dataset_version: z.literal(DATASET_VERSION),
  })
  .strict();
export type Submission = z.infer<typeof submissionSchema>;

const taskSchema = z
  .object({
    participantId: z.string().uuid(),
    datasetVersion: z.literal(DATASET_VERSION),
    tweetIds: z
      .array(tweetId)
      .length(5)
      .refine((ids) => new Set(ids).size === 5),
    answers: z.record(z.enum(EMOTIONS)),
    currentIndex: z.number().int().min(0).max(4),
    status: z.enum(["labeling", "review", "complete"]),
    editing: z.boolean(),
    submission: submissionSchema.optional(),
  })
  .strict()
  .superRefine((task, ctx) => {
    const full = task.tweetIds.every((id) => task.answers[id]);
    const expected = {
      participant_id: task.participantId,
      answers: task.tweetIds.map((id) => ({ tweet_id: id, selected_label: task.answers[id] })),
      dataset_version: task.datasetVersion,
    };
    if (
      Object.keys(task.answers).some((id) => !task.tweetIds.includes(id)) ||
      (task.status !== "labeling" && !full) ||
      (task.editing && (task.status !== "labeling" || !full)) ||
      (task.submission &&
        (task.status === "labeling" ||
          task.editing ||
          JSON.stringify(task.submission) !== JSON.stringify(expected))) ||
      (task.status === "complete" && !task.submission)
    ) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid saved task" });
    }
  });
export type TaskState = z.infer<typeof taskSchema>;

export function loadTask(): TaskState | null {
  const raw = localStorage.getItem(TASK_CONFIG.storageKey);
  if (!raw) return null;
  const task = taskSchema.parse(JSON.parse(raw));
  const participant = localStorage.getItem(TASK_CONFIG.participantKey);
  if (participant && participant !== task.participantId) throw new Error("Participant mismatch");
  if (!participant) localStorage.setItem(TASK_CONFIG.participantKey, task.participantId);
  return task;
}

export function createTask(): TaskState {
  const existing = loadTask();
  if (existing) return existing;
  const savedId = localStorage.getItem(TASK_CONFIG.participantKey);
  const participantId = savedId ? z.string().uuid().parse(savedId) : crypto.randomUUID();
  localStorage.setItem(TASK_CONFIG.participantKey, participantId);
  const pool = [...TWEETS];
  // Fisher–Yates: independent random sampling without replacement, no fixed seed.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return {
    participantId,
    datasetVersion: DATASET_VERSION,
    tweetIds: pool.slice(0, 5).map((t) => t.id),
    answers: {},
    currentIndex: 0,
    status: "labeling",
    editing: false,
  };
}

export function saveTask(task: TaskState) {
  localStorage.setItem(TASK_CONFIG.storageKey, JSON.stringify(taskSchema.parse(task)));
}

export function getAssignedTweets(task: TaskState) {
  return task.tweetIds.map((id) => TWEETS.find((tweet) => tweet.id === id)!);
}

export function prepareSubmission(task: TaskState): TaskState {
  const valid = taskSchema.parse(task);
  if (valid.status !== "review") throw new Error("Review all five answers before submitting.");
  if (valid.submission) return valid;
  return {
    ...valid,
    submission: submissionSchema.parse({
      participant_id: valid.participantId,
      answers: valid.tweetIds.map((id) => ({ tweet_id: id, selected_label: valid.answers[id] })),
      dataset_version: valid.datasetVersion,
    }),
  };
}
