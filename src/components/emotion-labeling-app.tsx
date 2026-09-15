import { useEffect, useRef, useState, type RefObject } from "react";
import { ArrowLeft, ArrowRight, Check, Info, Pencil, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { backendConfigured, submitResponses } from "@/lib/submissions";
import {
  EMOTIONS,
  createTask,
  getAssignedTweets,
  loadTask,
  saveTask,
  prepareSubmission,
  type Emotion,
  type TaskState,
} from "@/lib/emotion-task";

export function EmotionLabelingApp() {
  const [ready, setReady] = useState(false);
  const [task, setTask] = useState<TaskState | null>(null);
  const [instructions, setInstructions] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    try {
      setTask(loadTask());
    } catch {
      setStorageError(true);
    }
    setReady(true);
  }, []);

  const currentIndex = task?.currentIndex;
  const status = task?.status;
  useEffect(() => {
    headingRef.current?.focus();
  }, [currentIndex, status]);

  const persist = (next: TaskState) => {
    try {
      saveTask(next);
      setTask(next);
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  };

  const start = () => {
    try {
      const next = createTask();
      saveTask(next);
      setTask(next);
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  };

  if (!ready) return <main className="min-h-screen bg-background" aria-busy="true" />;

  return (
    <main className="min-h-screen bg-background px-5 py-5 sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-3xl flex-col sm:min-h-[calc(100vh-4rem)]">
        <header className="flex items-center justify-between border-b border-border pb-4">
          <span className="text-sm font-semibold">Emotion Labeling</span>
          {!backendConfigured && (
            <span className="text-xs text-muted-foreground">Collection not yet available</span>
          )}
        </header>
        <div className="flex flex-1 items-center py-10 sm:py-14">
          {!task ? (
            <Introduction onStart={start} storageError={storageError} />
          ) : (
            <TaskContent
              task={task}
              headingRef={headingRef}
              editing={task.editing}
              storageError={storageError}
              submitError={submitError}
              submitting={submitting}
              onInstructions={() => setInstructions(true)}
              onAnswer={(emotion) => {
                const id = task.tweetIds[task.currentIndex];
                if (!id || task.submission) return;
                persist({ ...task, answers: { ...task.answers, [id]: emotion } });
              }}
              onBack={() => persist({ ...task, currentIndex: task.currentIndex - 1 })}
              onNext={() => {
                if (task.editing) {
                  persist({ ...task, editing: false, status: "review" });
                } else if (task.currentIndex === 4) persist({ ...task, status: "review" });
                else persist({ ...task, currentIndex: task.currentIndex + 1 });
              }}
              onEdit={(index) => {
                if (!task.submission)
                  persist({ ...task, editing: true, currentIndex: index, status: "labeling" });
              }}
              onSubmit={async () => {
                if (submitLock.current) return;
                submitLock.current = true;
                setSubmitError(null);
                setSubmitting(true);
                try {
                  if (!backendConfigured)
                    throw new Error(
                      "Response collection is not available yet. Your answers are saved in this browser. Please try again once the study is available.",
                    );
                  const pending = prepareSubmission(task);
                  // Persist the immutable snapshot before the first network request.
                  saveTask(pending);
                  setTask(pending);
                  await submitResponses(pending.submission!);
                  const completed = { ...pending, status: "complete" as const };
                  setTask(completed);
                  try {
                    saveTask(completed);
                  } catch {
                    setStorageError(true);
                  }
                } catch (error) {
                  setSubmitError(
                    error instanceof Error
                      ? error.message
                      : "We could not confirm your submission. Your answers are still here. Please retry.",
                  );
                } finally {
                  submitLock.current = false;
                  setSubmitting(false);
                }
              }}
            />
          )}
        </div>
        <footer className="border-t border-border py-4 text-xs text-muted-foreground">
          {backendConfigured
            ? "CSE594 · Emotion labeling study"
            : "Response collection is not available yet. Answers remain in this browser until submission is available."}
        </footer>
      </div>
      {instructions && <InstructionsDialog onClose={() => setInstructions(false)} />}
    </main>
  );
}

function Introduction({ onStart, storageError }: { onStart: () => void; storageError: boolean }) {
  return (
    <section className="w-full max-w-2xl" aria-labelledby="intro-title">
      <p className="mb-3 text-sm font-medium text-primary">A short labeling task</p>
      <h1 id="intro-title" className="text-4xl font-semibold leading-tight sm:text-5xl">
        Emotion Labeling
      </h1>
      <div className="mt-8 max-w-xl space-y-4 text-base leading-7 text-muted-foreground sm:text-lg">
        <p>
          Read 5 short social media posts. For each post, choose the emotion that best represents
          what is expressed in the text.
        </p>
        <p>
          Choose one emotion for each post: anger, fear, joy, love, sadness, or surprise. If more
          than one seems to fit, select the best fit based on the text.
        </p>
        <p>
          The 5 posts are randomly selected. You can go back and change your answers before
          submitting.
        </p>
        <p>No name or email is required. Your responses are submitted with a random browser ID.</p>
      </div>
      <div className="mt-7 flex items-start gap-3 border-l-2 border-accent px-4 py-1 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        Some posts contain sensitive or adult language.
      </div>
      {storageError && <StorageError />}
      <Button size="lg" className="mt-9 h-12 px-6" onClick={onStart}>
        Start task <ArrowRight aria-hidden="true" />
      </Button>
    </section>
  );
}

type TaskProps = {
  task: TaskState;
  headingRef: RefObject<HTMLHeadingElement | null>;
  editing: boolean;
  storageError: boolean;
  submitError: string | null;
  submitting: boolean;
  onAnswer: (emotion: Emotion) => void;
  onInstructions: () => void;
  onBack: () => void;
  onNext: () => void;
  onEdit: (index: number) => void;
  onSubmit: () => void;
};

function TaskContent(props: TaskProps) {
  if (props.task.status === "complete")
    return <Completion headingRef={props.headingRef} storageError={props.storageError} />;
  if (props.task.status === "review") return <Review {...props} />;
  const tweets = getAssignedTweets(props.task);
  const tweet = tweets[props.task.currentIndex];
  if (!tweet) return <StorageError />;
  const selected = props.task.answers[tweet.id];
  return (
    <section className="w-full" aria-labelledby="task-heading">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">{props.task.currentIndex + 1} of 5</span>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${(props.task.currentIndex + 1) * 20}%` }}
            />
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={props.onInstructions}>
          <Info aria-hidden="true" /> Instructions
        </Button>
      </div>
      <h1 ref={props.headingRef} id="task-heading" tabIndex={-1} className="sr-only">
        Post {props.task.currentIndex + 1} of 5
      </h1>
      <blockquote className="border-l-4 border-primary bg-card px-6 py-7 text-xl font-medium leading-8 shadow-sm sm:px-9 sm:py-9 sm:text-2xl sm:leading-9">
        {tweet.text}
      </blockquote>
      <fieldset className="mt-9" disabled={props.submitting}>
        <legend className="mb-5 text-lg font-semibold">Which emotion best fits this text?</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {EMOTIONS.map((emotion) => (
            <label key={emotion} className="cursor-pointer">
              <input
                type="radio"
                name={`emotion-${tweet.id}`}
                value={emotion}
                checked={selected === emotion}
                onChange={() => props.onAnswer(emotion)}
                className="peer sr-only"
              />
              <span className="flex min-h-14 items-center gap-3 rounded-md border border-border bg-card px-4 text-sm font-medium capitalize transition-colors peer-checked:border-primary peer-checked:bg-accent peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full border border-muted-foreground">
                  {selected === emotion && <span className="size-2 rounded-full bg-primary" />}
                </span>
                {emotion}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {props.storageError && <StorageError />}
      <div className="mt-9 flex items-end justify-between gap-4 border-t border-border pt-6">
        <div>
          {props.task.currentIndex > 0 && !props.editing && (
            <Button variant="outline" onClick={props.onBack}>
              <ArrowLeft aria-hidden="true" /> Back
            </Button>
          )}
        </div>
        <div className="text-right">
          {!selected && (
            <p className="mb-2 text-xs text-muted-foreground">Choose an emotion to continue.</p>
          )}
          <Button onClick={props.onNext} disabled={!selected || props.storageError}>
            {props.editing
              ? "Return to review"
              : props.task.currentIndex === 4
                ? "Review answers"
                : "Next"}
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function Review(props: TaskProps) {
  const tweets = getAssignedTweets(props.task);
  return (
    <section className="w-full" aria-labelledby="review-title">
      <h1
        ref={props.headingRef}
        id="review-title"
        tabIndex={-1}
        className="text-3xl font-semibold sm:text-4xl"
      >
        Review your answers
      </h1>
      <p className="mt-3 text-muted-foreground">
        {props.task.submission
          ? "These answers are saved for submission. Retry to confirm the same responses."
          : "Check your selections before submitting. You can still change any answer."}
      </p>
      {props.submitError && (
        <div role="alert" className="mt-6 border-l-4 border-destructive bg-destructive/5 px-5 py-4">
          <p className="font-medium">Submission not confirmed</p>
          <p className="mt-1 text-sm text-muted-foreground">{props.submitError}</p>
        </div>
      )}
      {props.storageError && <StorageError />}
      <ol className="mt-7 divide-y divide-border border-y border-border">
        {tweets.map((tweet, index) => (
          <li key={tweet.id} className="py-5 sm:flex sm:items-start sm:gap-5">
            <span className="mb-2 block text-xs font-semibold text-muted-foreground sm:mb-0 sm:w-6 sm:pt-1">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="leading-6">{tweet.text}</p>
              <p className="mt-2 text-sm font-semibold capitalize text-primary">
                {props.task.answers[tweet.id]}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 sm:mt-0"
              disabled={props.submitting || Boolean(props.task.submission)}
              onClick={() => props.onEdit(index)}
            >
              <Pencil aria-hidden="true" /> Edit
            </Button>
          </li>
        ))}
      </ol>
      <div className="mt-7 flex justify-end">
        <Button
          size="lg"
          disabled={props.submitting || props.storageError}
          onClick={props.onSubmit}
          aria-live="polite"
        >
          {props.submitting ? (
            <>
              <RotateCcw className="animate-spin" aria-hidden="true" /> Submitting…
            </>
          ) : props.submitError || props.task.submission ? (
            "Try again"
          ) : (
            "Submit responses"
          )}
        </Button>
      </div>
    </section>
  );
}

function Completion({
  headingRef,
  storageError,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
  storageError: boolean;
}) {
  return (
    <section className="w-full max-w-xl" aria-labelledby="complete-title">
      <div className="mb-6 flex size-12 items-center justify-center rounded-full bg-accent text-primary">
        <Check className="size-6" aria-hidden="true" />
      </div>
      <h1
        ref={headingRef}
        id="complete-title"
        tabIndex={-1}
        className="text-4xl font-semibold sm:text-5xl"
      >
        Thank you!
      </h1>
      <p className="mt-5 text-lg leading-8 text-muted-foreground">
        Your 5 responses have been submitted.
      </p>
      {storageError && (
        <p role="alert" className="mt-4 text-sm">
          Your responses are saved on the server, but this browser could not remember completion. If
          asked after refreshing, retry to confirm the same submission.
        </p>
      )}
    </section>
  );
}

function StorageError() {
  return (
    <p
      role="alert"
      className="mt-5 border-l-4 border-destructive bg-destructive/5 px-4 py-3 text-sm"
    >
      We can’t save this task in your browser right now. Check your browser storage settings, then
      try again.
    </p>
  );
}

function InstructionsDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          dialogRef.current?.querySelector("button")?.focus();
        }
      }}
      aria-labelledby="instructions-title"
      className="m-auto w-[calc(100%_-_2.5rem)] max-w-lg rounded-md bg-popover p-6 text-foreground shadow-xl backdrop:bg-overlay sm:p-8"
    >
      <h2 id="instructions-title" className="text-2xl font-semibold">
        Instructions
      </h2>
      <div className="mt-5 space-y-4 leading-7 text-muted-foreground">
        <p>
          Read 5 randomly selected social media posts. For each post, choose the emotion that best
          represents what is expressed in the text.
        </p>
        <p>
          Choose one emotion for each post. If more than one seems to fit, select the best fit based
          on the text.
        </p>
        <p>You can go back and change your answers before submitting.</p>
      </div>
      <div className="mt-7 flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </dialog>
  );
}
