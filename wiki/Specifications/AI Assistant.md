# AI Assistant

An AI assistant in the editor that understands what's on screen and can build, edit, playtest and review scenarios: scenes, components, properties, conditionals and the logic between them.

This page is both the spec and the **progress tracker**. The work ships as **one PR with one commit per stage**. Tick items off as they are done.

## Progress

| Stage | Commit | Status |
| --- | --- | --- |
| 0 | `docs: AI assistant plan` | ✅ Done |
| 1 | `feat(ai): editor command API and scene snapshot` | ✅ Done |
| 2 | `feat: conditional destinations` | ✅ Done |
| 3 | `feat(ai): OpenRouter proxy` | 🟨 In progress |
| 4 | `feat(ai): assistant panel with ask, plan and build modes` | ⬜ Not started |
| 5 | `feat(ai): scene, property and logic tools` | ⬜ Not started |
| 6 | `feat(ai): test mode playtesting` | ⬜ Not started |
| 7 | `feat(ai): review mode for the dashboard` | ⬜ Not started |
| 8 | `feat(ai): fast path and evals` | ⬜ Not started |

Status values: ⬜ Not started · 🟨 In progress · ✅ Done (committed)

## How to work through this plan (instructions for the agent)

1. **Read this file first.** The first stage in the table that isn't ✅ is the current one.
2. **Only start a stage when the user says so** ("start stage N"). Mark it 🟨 In progress.
3. **Do only that stage's tasks.** If something belongs to a later stage, add a note to that stage instead of doing it.
4. **Verify** using that stage's checklist. Every box in it must be ticked before the stage is done. If something can't be verified, say so; never tick a box that wasn't actually checked.
5. **Tick off** the tasks and checks as they're done, and add a line to the [Log](#log).
6. **Stop.** Don't start the next stage. Give the user the git commands for this stage:
   - `git add` with the exact paths this stage changed
   - `git commit -m "<the stage's commit message>"`
   - `git push`
7. **Never commit or push yourself.** The user makes every commit. Don't add `Co-Authored-By` or any other Claude attribution to commits or PR text.
8. When the user confirms the commit, set the stage to ✅ in the table. That edit goes in the next stage's commit.

## Branch and PR

- **Branch:** `vps-ai-assistant`, off `vps-136-asset-library` (the assistant uses the asset library and the debug panel's checks). Rename it to include the ticket id if there is one.
- **PR:** one PR. Open it as a **draft** after stage 1 so reviewers can follow commit by commit. Its base is `vps-136-asset-library` until the PRs below it merge, then retarget to `master`. CI only runs once the base is `master`, so run the checks locally at every stage.
- **Merging:** ask whoever merges to use **Rebase and merge**, not squash, so the stage commits survive on `master`.

## Decisions

These are the defaults. Change them here if the team decides otherwise.

| Decision | Choice |
| --- | --- |
| Main model | Free Nemotron via OpenRouter, set in server config (`OPENROUTER_MODEL`), swappable without code changes |
| Vision | Optional. Spatial understanding comes from the structured scene snapshot; a rendered image is only used if a vision model is configured |
| Frontend test runner | Add **Vitest** (the commands are TypeScript; `node --test` can only run plain JS) |
| Schema validation | Add **Ajv**: the same JSON schemas the model sees validate every call |
| Conditional destinations | A real feature (stage 2). Rules are checked **after** the button's own property changes |
| AI playtesting | Runs in a **sandbox playthrough**, so it never overwrites the author's own test progress |
| Review mode | Available on both the editor and the dashboard |
| Student data | Never sent to the model. Review data is anonymised on the server (Group 1…n, no names or emails) |

## Architecture

```
Editor (browser)                          Backend                     OpenRouter
┌─────────────────────────────┐          ┌───────────────────┐       ┌────────────┐
│ AI panel (modes, log, stop) │          │ /api/ai/chat      │       │ main model │
│ Agent loop                  │ ───────► │  holds the key    │ ────► │ fast model │
│ Tool runner                 │          │  auth + author    │       └────────────┘
│   └─ Command API            │ ◄─────── │  mode tool list   │
│       (pure core + adapter) │ streamed │  limits, logging  │
└─────────────────────────────┘          └───────────────────┘
```

Principles:

1. **The command core is pure.** A command takes a scene (or scenario) document and arguments, and returns the new document and what changed. A thin adapter applies it to the live editor, so undo, autosave and live updates keep working. The same core runs in tests, in playtests and in headless evals.
2. **Commands can target any scene.** The open scene goes through the live editor operations; other scenes are patched through `modifyScene`.
3. **Modes decide which tools exist,** enforced by both the tool runner and the proxy, not by the prompt.
4. **The AI has exactly the user's permissions.** Every write goes through the existing authenticated APIs. Scenario text is data, never instructions.
5. **One AI turn is one undo step.**

### Modes

| Mode | Tools | What it's for |
| --- | --- | --- |
| Ask | Read | Questions about the scenario, explaining logic, running checks |
| Plan | Read + write as a dry run | Proposes a checklist of changes; applied only when approved, all or some, as one undo step |
| Build | Read + write | Applies changes directly; destructive actions pause for confirmation |
| Test | Read + playtest | Plays the scenario in a sandbox and reports problems |
| Review | Read + anonymised dashboard data | Where groups get stuck, which branches nobody takes |

---

## Stage 0: Plan and branch

**Commit:** `docs: AI assistant plan`

- [x] This plan is in `wiki/Specifications/AI Assistant.md`
- [x] Branch `vps-ai-assistant` created off `vps-136-asset-library` (after the asset library is committed)

---

## Stage 1: Editor command API and scene snapshot

**Commit:** `feat(ai): editor command API and scene snapshot`

**Goal:** a typed, validated, undo-safe way to do everything an author does by hand. No AI yet.

Tasks:

- [x] Add Vitest and Ajv as frontend dev dependencies; `yarn test` runs both the existing `node --test` files and Vitest
- [x] `features/authoring/commands/`: `defineCommand` (name, description for the model, JSON schema, kind `read` / `write` / `destructive`, pure `run`)
- [x] Registry and runner: validate with Ajv, resolve components by id or by name ("the Continue button"), apply, return `{ ok, changed, warnings }` or a readable error
- [x] Live editor adapter for the open scene; `modifyScene` adapter for other scenes
- [x] Batching: several commands become one undo step
- [x] Scene snapshot: each component's id, type, rounded bounds (1920×1080 canvas), rotation, layer, colours, plain text, clickable, destination, property operations, bindings; plus the selection
- [x] Scenario overview: scenes, links between them, properties
- [x] Spatial warnings on every write: overlaps, off-canvas, text too big for its box
- [x] Read commands: `get_scene`, `get_scenario`, `get_selection`, `find_components`, `run_checks` (reuses `playScenario/debug/checks.js`)
- [x] Write commands: `add_shape`, `add_text`, `add_button` (library presets), `add_library_item`, `set_style`, `set_text`, `set_text_style`, `move`, `resize`, `rotate`, `align`, `distribute`, `place_relative`, `layer`, `select`
- [x] Destructive command: `delete_components`
- [x] Dev console: `window.vps.run(name, args)` in dev builds only

Verify:

- [x] Vitest covers every command, validation errors, the snapshot, layout maths, overlap detection and batching
- [x] Browser check: a scene built entirely from the dev console, then undone in one step
- [x] Frontend: `yarn prettier`, `yarn lint`, `yarn test`, `yarn build` all pass

Notes:

- 22 commands: 6 read (`get_scene`, `get_scenario`, `get_selection`, `find_components`, `list_library`, `run_checks`), 1 destructive (`delete_components`), the rest write. `select` is classed as `read` because it changes what the author sees, not the scenario, so it's safe in Ask mode.
- Built to be driven without a model: `window.vps.run(name, args)` and `window.vps.batch([...])` in dev builds, `vps.commands()` and `vps.tools()` to see what a model will see.
- Components can be referred to by id, the first few characters of an id, `"selected"`, or the text they show. Scenes by name or id.
- `add_library_item` supports the **built-in** presets only. A user's uploads need an async step (creating the scenario's own file), so they come in stage 5.
- A command on a scene that isn't open saves through `modifyScene` and **can't be undone with Ctrl+Z** (the editor's history only knows the open scene). Batches on the open scene are one undo step.
- Text fit is an **estimate** from the font size (commands have no canvas to measure with); it only warns when text clearly won't fit.
- `align` and `distribute` use components' unrotated boxes; off-canvas and overlap warnings use the rotated box.
- Fixes found while testing in the real editor, both needed for this to be safe:
  - Redoing the adding of a sound crashed the selection overlay (redo selects the sound, which has no canvas position). `getSelectedComponentBounds` now ignores components with no bounds.
  - The live adapter clears the selection before removing selected components, as the editor's own delete does.
- Small refactors of existing code, behaviour unchanged: `defaults` moved to `scene/defaults.ts` (re-exported from `component.ts`), layer shifting moved to the pure `scene/layers.ts`, `history.ts` gained `beginHistoryBatch` / `endHistoryBatch`, `modifiers.ts` gained `overwrite`.
- Vitest 3 (not the latest) because it supports this repo's Vite 6. Specs are `*.spec.ts`; the older plain-JS tests stay `*.test.js` under `node --test`.
- CI doesn't run `yarn test` for the frontend. Worth adding a test job to `frontend-ci.yml` (not done here).

---

## Stage 2: Conditional destinations

**Commit:** `feat: conditional destinations`

**Goal:** a button can lead to different scenes depending on properties. For example, Next goes to "Deteriorates" if `heartRate > 120`, otherwise to "Stable".

Tasks:

- [x] Data: `nextSceneRules: [{ stateVariableId, comparator, value, sceneId }]` on buttons, checked in order; `nextScene` is the fallback; comparators `=`, `!=`, `>`, `<`
- [x] Shared evaluator, used by both the server and the play page
- [x] Server: `navigate/user.js` and `navigate/group.js` evaluate the rules after the button's property changes; `getConnectedScenes` preloads every rule target
- [x] Play page: optimistic scene switch uses the same evaluator (the server still decides)
- [x] Editor: Destination section in the Button Actions panel (rules list and fallback)
- [x] Checks: rule pointing at a deleted property or scene; rule that can never match
- [x] Debug panel log says which rule fired
- [x] Dashboard graph draws labelled branch edges
- [x] Command: `set_conditional_destination`

Verify:

- [x] Evaluator unit tests (every comparator and type, order, fallback)
- [x] Single-player and multiplayer navigation API tests
- [x] Checks tests
- [x] Browser check: the example above works in play, the debug panel and the dashboard
- [x] Backend: `yarn prettier`, `yarn lint`, `yarn test` pass
- [x] Frontend: `yarn prettier`, `yarn lint`, `yarn test`, `yarn build` pass

Notes:

- Full write-up in [Conditional Destinations](Conditional%20Destinations.md). The rules are `nextSceneRules` on a button, checked in order, first match wins, `nextScene` is the fallback, and they are judged on the properties **after** the button's own operations.
- **The evaluator is two identical files**, `backend/src/util/properties/destination.js` and `frontend/src/components/Properties/destination.js`, because the two packages share no code. A frontend test fails if they differ, so when one changes, copy it over the other. The full cases are in the backend test (25), the frontend one keeps the copies in step.
- **Server order changed:** the new property values are worked out in memory first, then the destination is picked, then the path and properties are saved as before. Operations that are invalid for a property type now fail before the path is saved instead of after it.
- Beyond the task list, because rules would otherwise be half-supported:
  - Deleting a property now also removes the rules that use it (the cleanup moved to a tested function, `propertyReferences.js`).
  - A scene's direct link counts rule scenes as places its buttons can lead, so a branching button disables the direct link like two buttons do.
  - The preloaded scene ids are filtered to valid ids, so a bad rule scene id can't break loading the scene.
  - A button with only rules is clickable in play.
  - The debug panel's button list shows each button's rules, and the event log notes when the server picks a different scene than the page predicted.
  - The dashboard graph merges buttons that lead the same way into one edge (it used to draw one edge per button with the same id).
- `set_conditional_destination` is the 23rd command. It also sets a plain link (no rules, only `otherwise`). It takes property and scene **names**, reads the value as the property's own type, and refuses a comparator the type can't use.
- Checked in a real browser against the **real API routes**: a temporary Express host (in-memory Mongo, only the login faked) plus a temporary page mounting the real play page, editor and dashboard. Both are deleted. In it: "Next" adds 20 to heartRate (110 → 130) and goes to Deteriorates, "Calm down" takes 40 off (→ 70) and goes to Stable, the debug panel shows the rules and which one matched, a rule was added through the editor's dialog and saved, `set_conditional_destination` ran in the editor and one undo reverted it, and the dashboard drew the labelled edges.
- **Not exercised in a browser:** multiplayer play (covered by the group API tests), the "server chose a different scene" log (needs the page and server to disagree), and deleting a property from the editor (unit-tested).

---

## Stage 3: OpenRouter proxy

**Commit:** `feat(ai): OpenRouter proxy`

**Goal:** a safe server gateway. The key never reaches the browser.

Tasks:

- [x] `POST /api/ai/chat`: OpenAI-compatible request, streamed response
- [x] Config: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, optional `OPENROUTER_FAST_MODEL`; a missing key gives a clear `503`
- [x] Firebase auth; caller must be an author of the scenario
- [x] The requested mode's tool list is enforced (shared list of tool names per mode)
- [x] Maximum tokens and timeouts
- [x] Per-user daily request limit stored in Mongo (`AiUsage`), not in memory
- [x] Logging: model, token counts, latency, tool names; no prompt content by default
- [x] Document the endpoint in `wiki/Backend API.md` and the variables in the setup docs

Verify:

- [x] Tests with a mocked upstream: streaming passthrough, auth, author check, mode enforcement, limits, missing key
- [x] Backend: `yarn prettier`, `yarn lint`, `yarn test` pass

Notes:

- `POST /api/ai/chat` is documented in `wiki/Backend API.md`, and the settings in the setup page (there is now a `backend/.env.example`; the setup page mentioned one that wasn't in the repo).
- Code: `routes/api/ai.js` (the route), `util/ai/` (`config.js`, `modes.js`, `request.js`, `relay.js`, `stream.js`, `log.js`), `db/models/aiUsage.js` and `db/daos/aiUsageDao.js`.
- **The caller picks `"main"` or `"fast"`, never a model name.** The names are the server's settings, so nobody can run up a bill on an expensive model. Only a known set of request fields is passed on.
- **Tools per mode** live in `backend/src/util/ai/modes.js` as tool name → kind, plus which kinds each mode allows. The editor and backend share no code, so a frontend test (`commands/__tests__/modes.spec.ts`) fails if a command is missing from that list or listed with a different kind. A tool the mode doesn't allow is a `403`, one that doesn't exist a `400`.
- **Daily limit:** 200 requests per author per UTC day by default (`AI_DAILY_LIMIT`), kept in Mongo. The document id is `uid:day`, so counting is one atomic update and twenty simultaneous requests still only get the limit's worth (tested). A request that fails before the model replies is given back. Token counts are recorded for the record.
- **Errors:** before the stream starts they are normal JSON errors (`503` not set up, `429` limit or provider busy, `502` provider problem, `504` slow). After it starts the status is already `200`, so the stream ends with `data: {"error": {"message", "code"}}`, where `code` is `timeout` or `interrupted`. The provider's own messages about the key are never passed on.
- The reply headers `X-AI-Limit` and `X-AI-Used` say how much of today's allowance is used (exposed to the browser, so the panel can show it).
- **Not checked against the real OpenRouter:** there is no key in this environment, so everything was tested against a fake provider that speaks the same streaming format over real HTTP. The first real check is to set `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` and send a request from the stage 4 panel. If a model refuses `stream_options`, drop it in `util/ai/request.js`. No model id is chosen here: it has to be one that supports tool use, which changes over time for the free ones.
- Added `413`, `429`, `502`, `503` and `504` to `util/status.js`.

---

## Stage 4: Assistant panel with Ask, Plan and Build modes

**Commit:** `feat(ai): assistant panel with ask, plan and build modes`

**Goal:** the assistant authors actually use.

Tasks:

- [ ] "AI Assistant" panel in the editor sidebar, using the same daisyUI tokens as the other panels: chat, mode switch, live activity log of tool calls (collapsible), Stop
- [ ] Agent loop in the browser: build context (system rules, coordinate system, mode, scenario overview, current scene snapshot, selection), call the proxy, run tool calls, send results back, repeat; step cap (about 15 per turn)
- [ ] Tool errors and malformed tool calls go back to the model as messages, not crashes
- [ ] JSON-mode fallback for models with weak native tool calling
- [ ] Ask mode: read tools only
- [ ] Plan mode: write tools as a dry run with placeholder names for created things; checklist preview; apply all or some as one undo step
- [ ] Build mode: writes apply directly, one undo step per turn; destructive tools pause for confirmation
- [ ] Soft-lock canvas editing during a Build turn ("AI is editing"), released by Stop or the end of the turn

Verify:

- [ ] Loop tests with a scripted fake model: tool calls, errors, step cap, Stop
- [ ] Plan mode tests: dry run, placeholders, partial apply, one undo step
- [ ] Browser check end to end against a fake proxy, in both themes
- [ ] Frontend: `yarn prettier`, `yarn lint`, `yarn test`, `yarn build` pass

Notes:

- From stage 3: send `scenarioId`, `mode`, `model` (`"main"` or `"fast"`) and `messages`, and only offer the tools for the mode: `toolDefinitions(MODE_KINDS[mode])`. The server refuses anything else.
- From stage 3: the reply is server-sent events. Handle an `{"error": {"code": "timeout" | "interrupted"}}` event mid-stream, and plain JSON errors (`503` not set up, `429`, `502`, `504`) before it. Show them as the messages they are.
- From stage 3: read `X-AI-Used` and `X-AI-Limit` from the reply to show what's left of today's allowance. A `429` has `meta.resetsAt`.

---

## Stage 5: Scene, property and logic tools

**Commit:** `feat(ai): scene, property and logic tools`

**Goal:** the AI can build whole scenarios, not just tidy one scene.

Tasks:

- [ ] Scene commands: `create_scene`, `rename_scene`, `duplicate_scene`, `delete_scene` (destructive), `reorder_scenes`, `set_background`, `set_timer`, `set_timer_operations`, `set_direct_link`
- [ ] Property commands: `create_property`, `update_property`, `delete_property` (destructive)
- [ ] Logic commands: `add_property_operation`, `set_destination`, `add_binding`, `list_resources`, `add_resource_conditional`
- [ ] Scenario overview covers the whole graph, including conditional edges
- [ ] System prompt gets a short "how VPS logic works" guide with examples

Verify:

- [ ] Vitest for each command
- [ ] End to end: a 3-scene branching scenario built from commands alone passes `run_checks`
- [ ] Frontend: `yarn prettier`, `yarn lint`, `yarn test`, `yarn build` pass

Notes:

- From stage 2: `set_conditional_destination` already sets a plain link (no rules, only `otherwise`), so `set_destination` can be a thinner tool for the common case or dropped.
- From stage 2: the scenario overview already lists conditional links (`when` on each link), so that task is mostly the scene-level graph.
- From stage 3: every new command also goes in `backend/src/util/ai/modes.js` with its kind, or the proxy refuses it and `modes.spec.ts` fails.

---

## Stage 6: Test mode (playtesting)

**Commit:** `feat(ai): test mode playtesting`

**Goal:** the AI plays the scenario and reports what's broken.

Tasks:

- [ ] Backend: sandbox playthrough for authors (`sandbox: true` on navigate, stored separately), with debug reset and jump support
- [ ] Move navigation out of `PlayScenarioPage` into a shared module; headless `PlaytestSession` uses it
- [ ] Commands: `playtest_start`, `playtest_state`, `playtest_press`, `playtest_direct_link`, `playtest_jump`, `playtest_reset`
- [ ] Exploration: breadth-first over choices within a step budget, using reset and jump to cover branches
- [ ] Report: paths taken, property timeline, dead ends, unreachable scenes, rules that never fire, silent failures from the checks
- [ ] Test mode enabled in the panel

Verify:

- [ ] Sandbox isolation test: the author's own playthrough is untouched
- [ ] Exploration tests on fixture scenarios with known dead ends
- [ ] Play page still works after the navigation refactor (existing tests and a browser check)
- [ ] Backend and frontend checks pass

Notes:

- From stage 2: the destination rules are in `destination.js` (`resolveDestination`). The headless playtest should call that, with the properties after the button's operations, instead of re-implementing it.
- From stage 3: the playtest tools need the kind `playtest` (widen `CommandKind` in `commands/types.ts`). Add them to `backend/src/util/ai/modes.js` as `playtest`; test mode already allows that kind.

---

## Stage 7: Review mode (dashboard)

**Commit:** `feat(ai): review mode for the dashboard`

**Goal:** "Where are groups getting stuck?"

Tasks:

- [ ] Backend: `GET /api/ai/review/:scenarioId`, author only, anonymised on the server: Group 1…n with sizes, progress, paths, current scene, properties, scene visit counts, branch choices
- [ ] Commands: `list_groups`, `group_progress`, `scenario_stats`, `compare_to_paths`
- [ ] Review mode in the editor panel, and the panel on the dashboard page (Review mode only)

Verify:

- [ ] Anonymisation test that fails if any name or email appears
- [ ] Aggregate and author-only access tests
- [ ] Browser check on the dashboard
- [ ] Backend and frontend checks pass

Notes:

- From stage 3: the review tools need the kind `review` (widen `CommandKind`), added to `backend/src/util/ai/modes.js`; review mode already allows it. The anonymised data should be built on the server, so the model never sees names or emails.

---

## Stage 8: Fast path and evals

**Commit:** `feat(ai): fast path and evals`

**Goal:** fast and cheap on a rate-limited free model, and measurably good.

Tasks:

- [ ] Deterministic parser for common edits on the selection ("make it red", "move left 50", "bigger"): no model call
- [ ] Small-model classifier that picks the tool subset for everything else
- [ ] `ai-evals/`: tasks with a prompt, a starting fixture and assertions (checks pass, snapshot conditions, playtest reaches the end)
- [ ] Node runner that drives the pure command core against the proxy
- [ ] Report success rate, steps and tokens per task

Verify:

- [ ] Parser unit tests
- [ ] Eval runner works against a fake model; one real run against the configured model, results recorded in the Log
- [ ] Backend and frontend checks pass

Notes:

- From stage 3: the proxy only streams, and counts against the author's daily limit. Evals that go through it need to read the stream (or the proxy needs a non-streaming option), and a big eval run would need its own limit.

---

## Risks

| Risk | Mitigation |
| --- | --- |
| The free model's tool calling is unreliable | Tool subsets, validation errors fed back, JSON fallback, evals to measure it |
| Free endpoint rate limits | Fast path, step cap, few calls per task |
| Prompts logged by a free provider | No student data in prompts, anonymised review data; check the model's policy |
| AI and author editing at once | Soft lock during Build turns, with Stop |
| A bad AI change | One undo step per turn, Plan mode, confirmation for destructive actions |
| Large scenarios overflow the context | Overview plus on-demand reads instead of everything at once |

## Log

Add one line per stage when it's done: date, stage, anything notable.

- 2026-10-12, stage 1: command API with 22 commands, scene snapshot, spatial warnings, live editor adapter and dev console. 201 Vitest specs; verified in the real editor (one batch built a scene, one undo removed it).
- 2026-10-12, stage 2: conditional destinations (`nextSceneRules`) end to end: shared evaluator, server and play page, editor UI, checks, debug panel, dashboard labels and `set_conditional_destination`. 76 node + 236 Vitest frontend tests, 301 backend tests; verified in a browser against the real API routes.
- 2026-10-12, stage 3: `POST /api/ai/chat` OpenRouter proxy: streamed passthrough, server-held key, author check, tool lists enforced per mode, per-author daily limit in Mongo, timeouts, one log line per request. 112 new backend tests (413 in all); tested against a fake provider, not yet the real OpenRouter.
