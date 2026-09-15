import { submissionSchema, type Submission } from "@/lib/emotion-task";

const projectUrl = import.meta.env["VITE_SUPABASE_URL"]?.trim() ?? "";
const publicKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"]?.trim() ?? "";
export const backendConfigured =
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(projectUrl) &&
  /^sb_publishable_[A-Za-z0-9_-]+$/.test(publicKey);

// One Supabase Data API call. Never send an admin key or read the submissions table.
export async function submitResponses(submission: Submission): Promise<void> {
  const payload = submissionSchema.parse(submission);
  if (!backendConfigured) {
    throw new Error(
      "Response collection is not available yet. Your answers are saved in this browser. Please try again once the study is available.",
    );
  }
  let response: Response;
  try {
    response = await fetch(`${projectUrl}/rest/v1/rpc/submit_emotion_task`, {
      method: "POST",
      headers: { apikey: publicKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        p_participant_id: payload.participant_id,
        p_answers: payload.answers,
        p_dataset_version: payload.dataset_version,
      }),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new Error(
      "We could not confirm whether your responses were saved. Your answers are still here. Retry to confirm the same submission.",
    );
  }
  if (response.status === 409) {
    throw new Error(
      "A different submission already exists for this browser ID. Your answers are still here; the saved submission has not been changed.",
    );
  }
  if (!response.ok) {
    throw new Error(
      "The server did not confirm your submission. Your answers are still here. Please try again.",
    );
  }
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    /* Unconfirmed responses never count as success. */
  }
  if (result !== true)
    throw new Error("We could not confirm the save. Please retry the same submission.");
}
