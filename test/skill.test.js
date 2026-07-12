import assert from "node:assert/strict";
import test from "node:test";

import { createHomeOutput } from "../src/cli.js";
import { SKILL_DESCRIPTION, createSkillMarkdown } from "../src/skill.js";

test("createSkillMarkdown emits valid frontmatter naming the lavish skill", () => {
  const md = createSkillMarkdown();
  assert.ok(md.startsWith("---\n"), "starts with frontmatter fence");
  const end = md.indexOf("\n---\n", 4);
  assert.ok(end > 0, "frontmatter is closed");
  const frontmatter = md.slice(4, end);
  assert.match(frontmatter, /^name: lavish$/m);
  assert.match(frontmatter, /^description: /m);
  assert.match(frontmatter, /^license: MIT$/m);
  assert.ok(frontmatter.includes(SKILL_DESCRIPTION), "frontmatter carries the skill description");
});

test("createSkillMarkdown keeps optional metadata inside Agent Skills fields", () => {
  const md = createSkillMarkdown();
  const frontmatter = md.slice(4, md.indexOf("\n---\n", 4));

  assert.doesNotMatch(frontmatter, /^argument-hint:/m, "argument hint is not a top-level field");
  assert.doesNotMatch(frontmatter, /^author:/m, "author is not a top-level field");
  assert.match(frontmatter, /^metadata:\n {2}argument-hint: /m);
  assert.match(frontmatter, /^ {2}author: "Kun Chen \(kunchenguid\)"$/m);
  assert.match(frontmatter, /^ {2}upstream: "https:\/\/github\.com\/kunchenguid\/lavish-axi"$/m);
  assert.doesNotMatch(frontmatter, /^version:/m, "version is omitted to avoid release churn");
});

test("createSkillMarkdown handles explicit /lavish invocation arguments", () => {
  const md = createSkillMarkdown();
  const body = md.slice(md.indexOf("\n---\n", 4) + 5);

  assert.ok(body.includes("$ARGUMENTS"), "body consumes slash-command arguments");
  assert.match(body, /empty/i, "explains the model-invoked case where no arguments are passed");
});

test("createSkillMarkdown mirrors the no-args home output", () => {
  const md = createSkillMarkdown();
  const home = createHomeOutput({ bin: "lavish-axi", sessions: [], includeSessions: false, agent: "static" });

  assert.ok(md.includes(home.description), "includes the product description");

  for (const item of home.visual_guidance) {
    assert.ok(md.includes(item), `includes visual guidance: ${item.slice(0, 32)}...`);
  }

  for (const playbook of home.playbooks) {
    assert.ok(md.includes(playbook.id), `includes playbook id: ${playbook.id}`);
    assert.ok(md.includes(playbook.use_when), `includes playbook use_when: ${playbook.id}`);
  }

  for (const item of home.help) {
    assert.ok(md.includes(item), `includes help: ${item.slice(0, 32)}...`);
  }
});

test("createSkillMarkdown keeps static poll guidance agent-neutral", () => {
  const md = createSkillMarkdown();

  assert.doesNotMatch(md, /keep the poll attached to the active turn/i);
  assert.doesNotMatch(md, /run the poll as a background task/);
  assert.doesNotMatch(md, /Codex detected/);
  assert.match(md, /queued feedback is never lost/);
});

test("createSkillMarkdown requires opening every matching playbook", () => {
  const md = createSkillMarkdown();
  const playbooksSection = md.slice(md.indexOf("## Playbooks"), md.indexOf("## Commands & rules"));

  assert.ok(playbooksSection.includes("combines several playbooks"), "explains artifacts span playbooks");
  assert.ok(playbooksSection.includes("MUST open each matching playbook"), "requires opening matching playbooks");
  assert.ok(playbooksSection.includes("do not hand-build boxes-and-arrows"), "names the diagram anti-pattern");
});

test("createSkillMarkdown does not leak live session state", () => {
  const md = createSkillMarkdown();
  assert.ok(!md.includes("pending_prompts"), "no session bookkeeping fields");
  assert.ok(!/\/session\/[0-9a-f]{8}/.test(md), "no live session URLs");
});

test("createSkillMarkdown omits setup hooks guidance", () => {
  const md = createSkillMarkdown();
  assert.doesNotMatch(md, /setup hooks/);
});

test("createSkillMarkdown uses lavish-axi on PATH without an unpinned fallback", () => {
  const md = createSkillMarkdown();

  assert.match(md, /`lavish-axi <html-file>`/);
  assert.match(md, /pinned wrapper around a reviewed package version/);
  assert.match(md, /do not fall back to `npx -y lavish-axi` unless the user explicitly asks/);
  assert.doesNotMatch(md, /Stefan's dotfiles/);
  assert.doesNotMatch(md, /Run `npx -y lavish-axi/);
});
