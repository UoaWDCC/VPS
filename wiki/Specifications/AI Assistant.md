# AI Assistant

An AI assistant in the editor that understands what's on screen and can build, edit, playtest and review scenarios: scenes, components, properties, conditionals and the logic between them.

This page is both the spec and the **progress tracker**. The work ships as **one PR with one commit per stage**. Tick items off as they are done.

## Progress

| Stage | Commit | Status |
| --- | --- | --- |
| 0 | `docs: AI assistant plan` | ⬜ Not started |
| 1 | `feat(ai): editor command API and scene snapshot` | ⬜ Not started |
| 2 | `feat: conditional destinations` | ⬜ Not started |
| 3 | `feat(ai): OpenRouter proxy` | ⬜ Not started |
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

- [ ] This plan is in `wiki/Specifications/AI Assistant.md`
- [ ] Branch `vps-ai-assistant` created off `vps-136-asset-library` (after the asset library is committed)

---

## Stage 1: Editor command API and scene snapshot

**Commit:** `feat(ai): editor command API and scene snapshot`

**Goal:** a typed, validated, undo-safe way to do everything an author does by hand. No AI yet.

Tasks:

- [ ] Add Vitest and Ajv as frontend dev dependencies; `yarn test` runs both the existing `node --test` files and Vitest
- [ ] `features/authoring/commands/`: `defineCommand` (name, description for the model, JSON schema, kind `read` / `write` / `destructive`, pure `run`)
- [ ] Registry and runner: validate with Ajv, resolve components by id or by name ("the Continue button"), apply, return `{ ok, changed, warnings }` or a readable error
- [ ] Live editor adapter for the open scene; `modifyScene` adapter for other scenes
- [ ] Batching: several commands become one undo step
- [ ] Scene snapshot: each component's id, type, rounded bounds (1920×1080 canvas), rotation, layer, colours, plain text, clickable, destination, property operations, bindings; plus the selection
- [ ] Scenario overview: scenes, links between them, properties
- [ ] Spatial warnings on every write: overlaps, off-canvas, text too big for its box
- [ ] Read commands: `get_scene`, `get_scenario`, `get_selection`, `find_components`, `run_checks` (reuses `playScenario/debug/checks.js`)
- [ ] Write commands: `add_shape`, `add_text`, `add_button` (library presets), `add_library_item`, `set_style`, `set_text`, `set_text_style`, `move`, `resize`, `rotate`, `align`, `distribute`, `place_relative`, `layer`, `select`
- [ ] Destructive command: `delete_components`
- [ ] Dev console: `window.vps.run(name, args)` in dev builds only

Verify:

- [ ] Vitest covers every command, validation errors, the snapshot, layout maths, overlap detection and batching
- [ ] Browser check: a scene built entirely from the dev console, then undone in one step
- [ ] Frontend: `yarn prettier`, `yarn lint`, `yarn test`, `yarn build` all pass

Notes:

---

## Stage 2: Conditional destinations

**Commit:** `feat: conditional destinations`

**Goal:** a button can lead to different scenes depending on properties. For example, Next goes to "Deteriorates" if `heartRate > 120`, otherwise to "Stable".

Tasks:

- [ ] Data: `nextSceneRules: [{ stateVariableId, comparator, value, sceneId }]` on buttons, checked in order; `nextScene` is the fallback; comparators `=`, `!=`, `>`, `<`
- [ ] Shared evaluator, used by both the server and the play page
- [ ] Server: `navigate/user.js` and `navigate/group.js` evaluate the rules after the button's property changes; `getConnectedScenes` preloads every rule target
- [ ] Play page: optimistic scene switch uses the same evaluator (the server still decides)
- [ ] Editor: Destination section in the Button Actions panel (rules list and fallback)
- [ ] Checks: rule pointing at a deleted property or scene; rule that can never match
- [ ] Debug panel log says which rule fired
- [ ] Dashboard graph draws labelled branch edges
- [ ] Command: `set_conditional_destination`

Verify:

- [ ] Evaluator unit tests (every comparator and type, order, fallback)
- [ ] Single-player and multiplayer navigation API tests
- [ ] Checks tests
- [ ] Browser check: the example above works in play, the debug panel and the dashboard
- [ ] Backend: `yarn prettier`, `yarn lint`, `yarn test` pass
- [ ] Frontend: `yarn prettier`, `yarn lint`, `yarn test`, `yarn build` pass

Notes:

---

## Stage 3: OpenRouter proxy

**Commit:** `feat(ai): OpenRouter proxy`

**Goal:** a safe server gateway. The key never reaches the browser.

Tasks:

- [ ] `POST /api/ai/chat`: OpenAI-compatible request, streamed response
- [ ] Config: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, optional `OPENROUTER_FAST_MODEL`; a missing key gives a clear `503`
- [ ] Firebase auth; caller must be an author of the scenario
- [ ] The requested mode's tool list is enforced (shared list of tool names per mode)
- [ ] Maximum tokens and timeouts
- [ ] Per-user daily request limit stored in Mongo (`AiUsage`), not in memory
- [ ] Logging: model, token counts, latency, tool names; no prompt content by default
- [ ] Document the endpoint in `wiki/Backend API.md` and the variables in the setup docs

Verify:

- [ ] Tests with a mocked upstream: streaming passthrough, auth, author check, mode enforcement, limits, missing key
- [ ] Backend: `yarn prettier`, `yarn lint`, `yarn test` pass

Notes:

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
