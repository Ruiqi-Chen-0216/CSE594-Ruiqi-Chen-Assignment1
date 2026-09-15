// Interface tests use intercepted API responses for repeatable failure/retry checks.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, mkdir } from "node:fs/promises";
import { once } from "node:events";
import { chromium } from "playwright";

const base = "/CSE594-Ruiqi-Chen-Assignment1/";
const origin = "http://127.0.0.1:4179";
const url = origin + base;
const key = "cse594-emotion-task-live-v1";
const env = {
  ...process.env,
  VITE_BASE_PATH: base,
  VITE_SUPABASE_URL: "https://assignment-test.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_browser_contract_test",
};
await mkdir("test-results", { recursive: true });
const dataset = JSON.parse(await readFile("src/data/tweets.json", "utf8"));
const audit = JSON.parse(await readFile("data/text-review.json", "utf8"));
assert.equal(dataset.length, 60);
assert.deepEqual(
  dataset.map((t) => t.id),
  Array.from({ length: 60 }, (_, i) => `tweet_${String(i + 1).padStart(3, "0")}`),
);
assert.deepEqual(
  dataset,
  audit.items.map((t) => ({ id: t.tweet_id, text: t.display_text })),
);
assert(dataset.every((t) => Object.keys(t).sort().join() === "id,text"));

const build = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "build", "--outDir", "test-results/site"],
  { env, stdio: "inherit" },
);
assert.equal((await once(build, "exit"))[0], 0);
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--outDir",
    "test-results/site",
    "--host",
    "127.0.0.1",
    "--port",
    "4179",
    "--strictPort",
  ],
  { env, stdio: "pipe" },
);
let browser;
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {
      /* Wait for local preview. */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}),
  });
  const first = await browser.newContext();
  const second = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await first.newPage();
  const mobile = await second.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const readTask = (p) => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
  const choose = (p, emotion) =>
    p
      .locator("label")
      .filter({ hasText: new RegExp(`^${emotion}$`) })
      .click();
  const heading = (p, name) => p.getByRole("heading", { name, exact: true }).waitFor();
  await page.goto(url);
  await page.evaluate(() =>
    localStorage.setItem("emotion-labeling-task-v1", JSON.stringify({ status: "complete" })),
  );
  await page.reload();
  await page.getByRole("button", { name: "Start task" }).click();
  assert(await page.getByRole("button", { name: "Next", exact: true }).isDisabled());
  assert.equal(await page.locator("input:checked").count(), 0);
  const initial = await readTask(page);
  assert.equal(new Set(initial.tweetIds).size, 5);
  await mobile.goto(url);
  await mobile.getByRole("button", { name: "Start task" }).click();
  const other = await readTask(mobile);
  assert.notEqual(initial.participantId, other.participantId);
  assert.notDeepEqual([...initial.tweetIds].sort(), [...other.tweetIds].sort());
  console.log(
    "PASS: two independent browser IDs and distinct random sets of five (not a global uniqueness guarantee)",
  );

  await page.getByRole("radio", { name: "anger", exact: true }).focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowRight");
  assert(await page.getByRole("radio", { name: "fear", exact: true }).isChecked());
  await page.getByRole("button", { name: "Instructions", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  await page.keyboard.press("Tab");
  assert(
    await page.evaluate(() => document.querySelector("dialog").contains(document.activeElement)),
  );
  await page.keyboard.press("Escape");
  assert(
    await page
      .getByRole("button", { name: "Instructions", exact: true })
      .evaluate((e) => e === document.activeElement),
  );
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  assert(await page.getByRole("radio", { name: "fear", exact: true }).isChecked());
  const draft = await readTask(page);
  await page.reload();
  await heading(page, "Post 1 of 5");
  assert.deepEqual(await readTask(page), draft);
  for (let i = 0; i < 5; i++) {
    await choose(page, "joy");
    await page
      .getByRole("button", { name: i === 4 ? "Review answers" : "Next", exact: true })
      .click();
  }
  await page.getByRole("button", { name: "Edit", exact: true }).nth(2).click();
  await page.reload();
  await heading(page, "Post 3 of 5");
  await choose(page, "love");
  await page.getByRole("button", { name: "Return to review" }).click();
  await heading(page, "Review your answers");
  await page.screenshot({ path: "test-results/review-desktop.png", fullPage: true });
  console.log(
    "PASS: keyboard radios/dialog, draft refresh, Back, Review edit and refresh return directly to Review",
  );

  const payloads = [];
  let outcome = "network";
  await page.route(
    "https://assignment-test.supabase.co/rest/v1/rpc/submit_emotion_task",
    async (route) => {
      payloads.push(route.request().postDataJSON());
      await new Promise((resolve) => setTimeout(resolve, 250));
      if (outcome === "network") return route.abort("failed");
      if (outcome === "conflict")
        return route.fulfill({
          status: 409,
          contentType: "application/json",
          body: '{"message":"Submission conflict"}',
        });
      return route.fulfill({ contentType: "application/json", body: "true" });
    },
  );
  await page.getByRole("button", { name: "Submit responses" }).click();
  assert(await page.getByRole("button", { name: "Submitting…" }).isDisabled());
  await page.getByRole("alert").waitFor();
  assert.equal(await page.getByRole("heading", { name: "Thank you!" }).count(), 0);
  const pending = await readTask(page);
  assert.equal(pending.submission.answers.length, 5);
  assert(await page.getByRole("button", { name: "Edit", exact: true }).first().isDisabled());
  assert.equal(payloads.length, 1);
  await page.reload();
  await heading(page, "Review your answers");
  assert.deepEqual(await readTask(page), pending);
  outcome = "conflict";
  await page.getByRole("button", { name: "Try again" }).click();
  await page.getByRole("alert").waitFor();
  assert.match(await page.getByRole("alert").innerText(), /different submission/);
  assert.equal(await page.getByRole("heading", { name: "Thank you!" }).count(), 0);
  outcome = "success";
  await page.getByRole("button", { name: "Try again" }).click();
  await heading(page, "Thank you!");
  assert.deepEqual(payloads[0], payloads[1]);
  assert.deepEqual(payloads[0], payloads[2]);
  assert.deepEqual(
    payloads[0].p_answers,
    pending.tweetIds.map((id) => ({ tweet_id: id, selected_label: pending.answers[id] })),
  );
  await page.reload();
  await heading(page, "Thank you!");
  assert.equal(await page.getByRole("button", { name: "Start task" }).count(), 0);
  console.log(
    "PASS: failed/unconfirmed save retains frozen payload; conflict never succeeds; identical retry and acknowledged completion survive refresh (stubbed API)",
  );

  for (let i = 0; i < 5; i++) {
    assert(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await choose(mobile, "sadness");
    await mobile
      .getByRole("button", { name: i === 4 ? "Review answers" : "Next", exact: true })
      .click();
  }
  await heading(mobile, "Review your answers");
  assert(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await mobile.screenshot({ path: "test-results/review-mobile.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: mobile five-question flow and review without horizontal overflow; production build works under repository subpath; no browser runtime errors",
  );
  console.log("Browser tests passed. Hosted-database test results are described in README.md.");
} finally {
  await browser?.close();
  server.kill();
}
