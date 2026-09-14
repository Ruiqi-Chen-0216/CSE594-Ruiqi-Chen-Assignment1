export const TASK_CONFIG = {
  preview: true,
  previewLabel: "Frontend preview",
  previewNotice: "Responses are stored in this browser only.",
  storageKey: "emotion-labeling-task-v1",
  submissionDelayMs: 900,
} as const;

export const EMOTIONS = ["anger", "fear", "joy", "love", "sadness", "surprise"] as const;
export type Emotion = (typeof EMOTIONS)[number];
export type Tweet = { id: string; text: string };
export type TaskStatus = "labeling" | "review" | "complete";
export type TaskState = {
  participantId: string;
  tweetIds: string[];
  answers: Partial<Record<string, Emotion>>;
  currentIndex: number;
  status: TaskStatus;
};

export const TWEETS: Tweet[] = [
  {
    "id": "tweet_001",
    "text": "i really do feel for kids who are tortured in highschool"
  },
  {
    "id": "tweet_002",
    "text": "i feel the need to blog pagetitle from flab to fab"
  },
  {
    "id": "tweet_003",
    "text": "i need to go and im feeling a longing inside at that point for him"
  },
  {
    "id": "tweet_004",
    "text": "i feel but distressed is sufficient"
  },
  {
    "id": "tweet_005",
    "text": "i dunnno i just feel sorta discontent but im tired and stuff i just wanna go to bed"
  },
  {
    "id": "tweet_006",
    "text": "i do know im feeling times more guilty"
  },
  {
    "id": "tweet_007",
    "text": "i remember feeling the most terrified i had ever felt in my entire life and that its still affecting me now but ive never thought it accounted to trauma"
  },
  {
    "id": "tweet_008",
    "text": "i hear that bird i know that all is well and i feel safe"
  },
  {
    "id": "tweet_009",
    "text": "i feel that im not talented in baking"
  },
  {
    "id": "tweet_010",
    "text": "i like this so much but i feel like somehow this will be a term that becomes more popular in the future"
  },
  {
    "id": "tweet_011",
    "text": "i just feel more resentful and tell myself it was better if i did not share with him"
  },
  {
    "id": "tweet_012",
    "text": "i know i just ended a very big giveaway here on the muse but im still feeling quite generous"
  },
  {
    "id": "tweet_013",
    "text": "i feel unloved you are there to remind me you love me"
  },
  {
    "id": "tweet_014",
    "text": "i dissect every new fact that comes to surface i feel more disheartened"
  },
  {
    "id": "tweet_015",
    "text": "i was put on a less powerful pain med drip but i didnt feel out of control so i liked that drug better"
  },
  {
    "id": "tweet_016",
    "text": "i am on the write track i feel contented and at peace"
  },
  {
    "id": "tweet_017",
    "text": "i was feeling listless from the need of new things something different"
  },
  {
    "id": "tweet_018",
    "text": "i was feeling horny so we let her in"
  },
  {
    "id": "tweet_019",
    "text": "i have a feeling i may be popular with the lady folk"
  },
  {
    "id": "tweet_020",
    "text": "i feel bouncy and weird and strange and i love it"
  },
  {
    "id": "tweet_021",
    "text": "i always feel overwhelmed with a mixture of feelings while listening to these songs"
  },
  {
    "id": "tweet_022",
    "text": "i was feeling that we had two too many as it was but oh well"
  },
  {
    "id": "tweet_023",
    "text": "i had on my plate without the stress of feeling completely overwhelmed"
  },
  {
    "id": "tweet_024",
    "text": "i love the smell it makes me feel invigorated and fresh and happy"
  },
  {
    "id": "tweet_025",
    "text": "i had been feeling suspicious all day"
  },
  {
    "id": "tweet_026",
    "text": "i am feeling rebellious which is often i suppose"
  },
  {
    "id": "tweet_027",
    "text": "i may also voice my feelings on a few things here and there if you dont agree with them cool and please do feel free to let me know"
  },
  {
    "id": "tweet_028",
    "text": "i feel she was wronged"
  },
  {
    "id": "tweet_029",
    "text": "i am feeling irate"
  },
  {
    "id": "tweet_030",
    "text": "i have been blogging i have told you of the countless ways that i feel loved and blessed by the people i call my friends"
  },
  {
    "id": "tweet_031",
    "text": "i stop learning or if i am feeling inhibited my performance flounders"
  },
  {
    "id": "tweet_032",
    "text": "i need nine hours but it s true and if i get less even seven hours which is supposed to be the norm and which some people consider a lot i feel grumpy unhappy and seriously unmotivated"
  },
  {
    "id": "tweet_033",
    "text": "i feel irritable and low but i just cannot put my finger on what exactly i am unhappy about"
  },
  {
    "id": "tweet_034",
    "text": "i think its time to find better stress management techniques and choke back this feeling of being overwhelmed"
  },
  {
    "id": "tweet_035",
    "text": "i feel like these lenses look so cute"
  },
  {
    "id": "tweet_036",
    "text": "i was still feeling weird about the day before"
  },
  {
    "id": "tweet_037",
    "text": "i send an email and show my true feelings on an issue i do run risk of it being ignored"
  },
  {
    "id": "tweet_038",
    "text": "id feel completely lost without him"
  },
  {
    "id": "tweet_039",
    "text": "i do struggle i dont get anxious instead i feel that much more determined to succeed"
  },
  {
    "id": "tweet_040",
    "text": "i wonder why people feel the need to make up stories to be amazed at the miracles around us every day"
  },
  {
    "id": "tweet_041",
    "text": "im feeling ok other than the raging hormones"
  },
  {
    "id": "tweet_042",
    "text": "i went from feeling supportive kind and compassionate towards this person to wanting to lash out at them i can t though she blocked me clearly she has more experience at this than i do"
  },
  {
    "id": "tweet_043",
    "text": "im not feeling overwhelmed by school just yet i only give that a week or so hah"
  },
  {
    "id": "tweet_044",
    "text": "i don t mean this to be a serious recollection of feelings only a funny in a not funny sort of way story so let s get back to where the action begins"
  },
  {
    "id": "tweet_045",
    "text": "i feel so embarrassed of myself for even having the nerve to post them all up for everyone else to read"
  },
  {
    "id": "tweet_046",
    "text": "im known to feel affectionate toward those who adore leonard cohen is what makes me like him quite a lot"
  },
  {
    "id": "tweet_047",
    "text": "ive started to delve deep into myself and evaluate everything that has made me feel insecure or unworthy"
  },
  {
    "id": "tweet_048",
    "text": "i have every right to feel outraged that their legacy may be in danger"
  },
  {
    "id": "tweet_049",
    "text": "i feel like if i had a job worth caring about i wouldn t be so shifty"
  },
  {
    "id": "tweet_050",
    "text": "i will adjust to it but for now it feels so strange"
  },
  {
    "id": "tweet_051",
    "text": "im in a strange situation or feeling awkward i sometimes switch into comedian mode a bit of a defence mechanism from my self conscious school days and turned some of the sessions into katrinas minute stand up routine"
  },
  {
    "id": "tweet_052",
    "text": "i feel apprehensive and wonder if the marks i have made in the past are still there"
  },
  {
    "id": "tweet_053",
    "text": "i often times feel helpless in regards to my life s path"
  },
  {
    "id": "tweet_054",
    "text": "i get the feeling the oilers are hesitant to count on him again after he missed so much time a year ago"
  },
  {
    "id": "tweet_055",
    "text": "i feel funny just calling it a film"
  },
  {
    "id": "tweet_056",
    "text": "i am starting to feel emotional"
  },
  {
    "id": "tweet_057",
    "text": "im feeling really really left out and somewhat dissatisfied with everything"
  },
  {
    "id": "tweet_058",
    "text": "i feel really sad that my own girlfriend cannot even open up to me or communicate with me"
  },
  {
    "id": "tweet_059",
    "text": "i feel like a horrible rotten person for thinking that this is the most isolating thing a woman can go through and some days being tough is not an option"
  },
  {
    "id": "tweet_060",
    "text": "i sat silent and open mouthed as he rattled off the reasons why he loved me the special times we had shared which had confirmed his feelings and was amazed that they were the same reasons and times together that made me realize how much i loved him"
  }
];

const validEmotion = (value: unknown): value is Emotion =>
  typeof value === "string" && EMOTIONS.includes(value as Emotion);

export function loadTask(): TaskState | null {
  const raw = window.localStorage.getItem(TASK_CONFIG.storageKey);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as Partial<TaskState>;
  if (typeof parsed.participantId !== "string" || !Array.isArray(parsed.tweetIds) ||
      parsed.tweetIds.length !== 5 || new Set(parsed.tweetIds).size !== 5 ||
      !parsed.tweetIds.every((id) => TWEETS.some((tweet) => tweet.id === id)) ||
      !parsed.answers || typeof parsed.currentIndex !== "number" ||
      !["labeling", "review", "complete"].includes(parsed.status ?? "")) return null;
  const answers = Object.fromEntries(
    Object.entries(parsed.answers).filter(([id, value]) => parsed.tweetIds?.includes(id) && validEmotion(value)),
  );
  return { ...parsed, answers, currentIndex: Math.min(4, Math.max(0, parsed.currentIndex)) } as TaskState;
}

export function createTask(): TaskState {
  const pool = [...TWEETS];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[randomIndex]] = [pool[randomIndex], pool[index]];
  }
  return { participantId: crypto.randomUUID(), tweetIds: pool.slice(0, 5).map(({ id }) => id), answers: {}, currentIndex: 0, status: "labeling" };
}

export function saveTask(task: TaskState) {
  window.localStorage.setItem(TASK_CONFIG.storageKey, JSON.stringify(task));
}

export function getAssignedTweets(task: TaskState) {
  return task.tweetIds.map((id) => TWEETS.find((tweet) => tweet.id === id)).filter((tweet): tweet is Tweet => Boolean(tweet));
}

export async function submitTask(task: TaskState) {
  await new Promise((resolve) => window.setTimeout(resolve, TASK_CONFIG.submissionDelayMs));
  if (import.meta.env.DEV && window.localStorage.getItem("emotion-labeling:force-submit-failure") === "true") throw new Error("Mock submission failure");
  const completed = { ...task, status: "complete" as const };
  saveTask(completed);
  return completed;
}
