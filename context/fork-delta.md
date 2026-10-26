# Fork delta

This fork was reviewed against `upstream/main` at `0e2d3de` on 2026-10-26.
The upstream sync retains four intentional policies and four compatibility
fixes. Other historical fork commits no longer change the effective tree.

The reviewed delta from `4413dcc` through `0e2d3de` (v0.1.72–v0.1.93) includes
the HTML-tree session and asset confinement security fix, server discovery and
bind-durability rework with `--also-listen` inheritance, exclusive poll
ownership with `--owner` and `--takeover` plus the `reply` command with server
receipt, per-note delivery receipts, queued-annotation editing, whiteboard
libraries, the explanation playbook, and guidance relocation to
`docs/invariants.md` and `docs/delivery-acks.md`. Upstream release commits
through v0.1.93 were reviewed but their version changes were not imported
because this fork keeps its own release line.

Rollback point for this sync is the pre-sync fork head `3a5ca60`.
Prior reviewed upstream commit was `4413dcc` (v0.1.71).

## Retained policies

### Use the reviewed `lavish-axi` command on `PATH`

Commit `ea672f0` changed the generated public skill from an on-demand
`npx -y lavish-axi` invocation to the `lavish-axi` command supplied by the
environment. This lets managed installations pin and review the executable
instead of downloading whichever package version resolves at invocation time.

Keep this policy while the fork is distributed through a reviewed wrapper or
pinned installation. Its owner is `src/skill.js`; `skills/lavish/SKILL.md` is
generated from it via `pnpm run build:skill`. `README.md` and
`test/skill.test.js` describe and verify the policy. Upstream `AGENTS.md` was
restructured to point at owners instead of restating contracts, so no fork
sentence remains there; the CLI and README carry the policy.

Upstream added a `reply --help` line in the same `npx` shape. This sync
converts all four invocation lines to PATH form. The `upstream` provenance
field is retained alongside upstream's flat, string-valued Hermes fields.

### Require explicit authorization before hosted sharing

Commit `ea672f0` also changed agent-facing `share` guidance to require an
explicit user request before publishing an artifact outside the local machine.
This remains necessary because `share` sends content to a third-party service
and creates a public page by default unless the user supplies a password.

Keep this policy unless the publication boundary changes. Its owner is the
runtime guidance in `src/cli.js` (home output and `share` command help);
`test/cli-output.test.js` verifies both. `README.md` carries the matching
user-facing gate. The generated skill points at that live CLI guidance
instead of copying it. Upstream's `docs/invariants.md` hosted-sharing section
needed no fork edit.

### Require an explicit opt-in for Tailscale access

Upstream `443aaa9` automatically detects Tailscale and exposes the review
server on the machine's tailnet address whenever Tailscale is running. This
fork retains upstream's concrete-listener, MagicDNS, reconciliation, fallback,
and teardown implementation but enables it only when
`LAVISH_AXI_TAILSCALE=1` is set.

The default stays loopback-only because the review server is unauthenticated
and can read and serve local artifact files. Its owner is the activation gate
in `src/server.js` (`autoTailscale` requires `LAVISH_AXI_TAILSCALE=1`);
`test/server.test.js` verifies both the disabled default and the opted-in
behavior. `src/cli.js` server help, `README.md` Network binding, `src/paths.js`
comment, and `docs/invariants.md` process-model sentence carry the matching
runtime, user, and architecture guidance. Upstream `AGENTS.md` no longer states
the default directly; it points at those owners. `test/server-discovery.test.js`
needs the opt-in env in the two Tailscale tests because upstream assumes
automatic detection.

### Keep release metadata on the fork's release line

The sync imports upstream implementation commits but is not itself a release.
Keep `CHANGELOG.md`, `.release-please-manifest.json`, `package.json`, and
`plugin.json` at the versions from this fork's `main` branch. The fork's
Release Please workflow owns all four files and will advance them together when
the synced code is released here.

This also keeps upstream release commits from making an ordinary sync pull
request modify the two generated files rejected by the repository's generated
file guard. Re-evaluate this policy only if the fork stops publishing its own
release line or adopts an upstream-version mirroring workflow.

## Retained compatibility fixes

### Keep incomplete-publish warnings readable

`src/chrome-client.js` repairs the incomplete-publish warning assembled when
ht-ml.app returns an update key without a site id. Upstream still concatenates
the fragments as `thoughThe`. `test/chrome-client-queue.test.js` verifies the
rendered message through the chrome harness. Keep this fix until upstream
produces the same readable output.

### Keep browser E2E compatible across CLI versions

`test/attachment-upload.browser.test.js` keeps the fork's top-level
`decodeEvaluationResult` helper and Node-clock waits. Upstream `c95f3c4`
adopted an equivalent inner `decode()` helper and the new `.bubble.queued`
selectors, so this sync takes the upstream selectors and message wording while
keeping the fork's clock and helper instead of carrying two decoders. The
opt-in browser suites use the Node test clock for fixed delays because the
CLI's numeric `wait` command is not reliable across those versions, and they
establish a page before asking newer versions to emulate a viewport. These
changes affect test compatibility only. Keep them while the browser CLI used by
this fork has these version-dependent contracts.

### Bound listener-shutdown connection probes

`test/server.test.js` gives the connection probe a one-second timeout when it
checks whether a listener closed. Without the bound, an unreachable address
can leave the suite waiting on the operating system's TCP timeout. This changes
test reliability only and does not alter server behavior.

### Verify the deliberate-stop banner is truthful

`test/event-transport.browser.test.js` checks the message an older review tab
renders when a deliberate stop leaves it open. Two truthful copies can legitimately
win: the deliberate-stop copy “Lavish was stopped. Reload after you start it again.”
that the old server sends with `reason: "stop"`, and the generic “The Lavish server
this page was connected to is no longer running. Reloading will work once it is
running again.” copy that the tab's legacy EventSource reconnect to the replacement
server delivers with a neutral `server-restarted` reason. Which one the test reads
depends on whether the read lands before or after that reconnect fires, so the
assertion accepts either and only forbids the false “updated” copy. This documents
the stable end state - the banner must never claim Lavish was updated - rather than
one transient event order. The same test retries a read-only DOM observation when
the browser CLI reports that the expected migration navigation destroyed its
execution context. The event must still appear within the original deadline. The
test reconstructs its pre-WebSocket "old build"
with `git archive` from this fork's pre-sync commit
`54b55875b1d5cda18a9fe11889ab604e97f73798`, which still shipped the SSE
transport, so the seven-tab regression stays self-contained in fork-only clones
where upstream's intermediate commits are absent.

## Superseded commits

The following commits reduced false positives in the former automatic layout
audit:

- `75e69d2` checked rendered text fragments and downgraded contained overhang.
- `884f785` skipped unnecessary text walks for scrollable or truncated boxes.
- `65fb0b4` updated the related architecture notes.
- `896e317` corrected optional-parameter types for the new helpers.

The v0.1.48 upstream merge replaced that implementation with the passive layout
warning inbox and conservative diagnostic lifecycle. A diff from the v0.1.48
tag to the pre-sync fork shows no surviving code from these commits. Do not
reapply them during later upstream syncs. Revisit the old approach only if the
current audit reproduces the same false positives and a new test demonstrates
the regression.

Commit `3a3b41d` removed a test for the old installed-copy fallback. That removal
is now part of the retained PATH-only policy tests and needs no separate port.

## Future sync check

Before each upstream merge:

1. Compare the effective fork diff from the previous reviewed upstream commit,
   not the raw ahead/behind count after a squash merge.
2. Recheck whether upstream now satisfies any retained policy.
3. Merge the source owners first and regenerate `skills/lavish/SKILL.md` with
   `pnpm run build:skill`.
4. Restore the fork's four release-owned files from its target branch.
5. Run `pnpm run check` before committing or pushing the sync.
6. After the sync has a durable published commit, advance any deployment that
   pins this fork by commit SHA and verify the installed runtime separately.
