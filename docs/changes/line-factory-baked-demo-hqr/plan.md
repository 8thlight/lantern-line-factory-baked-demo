# Plan: line-factory-baked-demo-hqr

Class: fix. Issue #77 (filed from #76). Brief: docs/changes/line-factory-baked-demo-hqr/triage.md at commit bb3644c.

## Inputs, as verified

- triage.md: present at bb3644c. It carries the brief in full, the signed touches: and reproduces:, and the acceptance criterion. This plan reads it as the ratified spec.
- spec.md: not in the tree. This fix-class print has no spec stage, so the plan takes its touches: from triage.md and adds no others.
- plan/research.md: not in the tree. No research stage ran, so no scope was declared and this plan covers the whole brief.
- The tree today: .hydraflow/charter.yaml is 247 lines and has no `inherits: kernel`. .hydraflow/layout.yaml is 108 lines and lists 33 standards under `standards:`, and its rings already sit under test/. docs/standards/README.md is 19 lines. No file under test/ reads any of the three. The test/render.test.js that triage names does not exist, which changes nothing here. The suites are ESM node:test files using node:assert/strict, and `npm test` runs `node --test` on Node 22. tests/architecture/assertion_baseline.json and suppression_baseline.json exist, so the new standards page cites real files.

## Declared scope

None declared: plan/research.md does not exist. The plan covers the whole of triage.md's brief and nothing beyond it.

## Who meets it

- agent: the HydraFlow factory's stages and `hydraflow line-layout check` read .hydraflow/charter.yaml and .hydraflow/layout.yaml. After this change they resolve the charter through `inherits: kernel`, hold this line to the eleven product standards only, and read hygiene and testing as switched on over `checkout`.
- agent: a builder or reviewer agent that reads docs/standards/README.md to learn what each of the eleven standards holds this repository to, and how to switch hygiene or testing on with `hydraflow line-layout baseline --standard <name>`. No player meets it: the game under src/ does not change, so no design/ artboard applies.

## Refusals

- none: the change replaces declarations and adds one test. It adds no code path that refuses anything. The standards page quotes line-baseline/not-offered, but that refusal belongs to the installed hydraflow CLI and already exists; this print does not introduce it.

## Touches

touches:
  - .hydraflow/charter.yaml
  - .hydraflow/layout.yaml
  - docs/standards/README.md
  - test/hydraflow-declarations.test.js

reproduces:
  - test/hydraflow-declarations.test.js

The signed list holds the fix, so no touches amendment is needed. test/hydraflow-declarations.test.js matches the line's test path `test/**`, and its ring is unit, `test/{slug}.test.js`.

## Steps

1. **Red first: write test/hydraflow-declarations.test.js** and commit it alone, red against the tree as it stands.
   - Use the house style: `import { test } from 'node:test'`, `import assert from 'node:assert/strict'`, and `readFileSync` from `node:fs`. Resolve paths from `new URL('../.hydraflow/charter.yaml', import.meta.url)`, and the same for the layout, so the test does not depend on the working directory. Add no YAML dependency: the test reads text.
   - Charter tests:
     - (a) the file contains the line `  product: Lantern Line, a small browser tower-defence game`;
     - (b) it contains a line `inherits: kernel`;
     - (c) the `- name` lines under `articles:` → `  standards:` (the run of `  - ` lines that ends at the next line that is not a list item) equal, in order, exactly these eleven: ports_and_adapters, domain_entities, adr_enforcement, ci_is_configured, hygiene, testing, ubiquitous_language, code_craft, fail_closed, no_second_copy, line_contract.
   - Layout tests:
     - (d) the keys indented by exactly two spaces under the top-level `standards:` line, up to the next top-level key or the end of file, equal, as a sorted set, these eleven: adr_enforcement, ci_is_configured, code_craft, domain_entities, fail_closed, hygiene, line_contract, no_second_copy, ports_and_adapters, testing, ubiquitous_language;
     - (e) the `unit:` and `scenario:` values under the top-level `rings:` begin with `test/`.
   - Each assertion could be false. Against today's tree, (b), (c) and (d) fail: there is no inherits line, the charter lists 31 standards and the layout lists 33. Record that red run with `node --test test/hydraflow-declarations.test.js`.
2. **Replace .hydraflow/charter.yaml** with the body of the `~~~~yaml` block under "### `.hydraflow/charter.yaml`" in triage.md. Copy it byte for byte: no fence lines, one trailing newline, and LF endings. Extract it with a script rather than retyping it. For example, slice triage.md between the fence lines into /scratch, then `cp`, so no hand edit can drift.
3. **Replace .hydraflow/layout.yaml** the same way, from its `~~~~yaml` block.
4. **Replace docs/standards/README.md** the same way, from its `~~~~markdown` block. Leave its quoted `    hydraflow line-layout baseline --standard <name>` line indented by four spaces.
5. **Prove byte equality:** for each of the three files, `diff` the committed file against the block freshly extracted from triage.md, and expect no output.
6. **Green:** `node --test test/hydraflow-declarations.test.js` passes. Then `npm --prefix . run test` passes. That runs the existing game, path and targeting suites unchanged, plus the new file.
7. **Fence the diff:** `git diff --name-only main...HEAD` lists only the four paths under Touches plus this change's chain files under docs/changes/line-factory-baked-demo-hqr/. No existing file under src/ or test/ appears.

## Mandate class

.hydraflow/charter.yaml and .hydraflow/layout.yaml are mandate paths. The review reads its verdict on them as a veto (Ruling 83), and the PR body must disclose the class. Build does not wait on that. The content is the issue author's, carried byte for byte, and the build exercises no judgement over it.

## Risks

- **Fence nesting:** the issue quotes each file inside a `~~~~` fence, nested within a `~~~~~text` fence. An extractor must take the inner four-tilde fences only, and it must keep the blank lines and trailing spaces inside them. The markdown block holds no `~~~~` of its own, so the first closing `~~~~` after each opener ends it.
- **Byte-for-byte versus regeneration:** `hydraflow upgrade` may regenerate these files later. That is out of scope, and the test pins only the facts the acceptance names, not the whole text.

## Acceptance

This copies triage.md's criterion:
- The three files match issue #76's contents byte for byte.
- test/hydraflow-declarations.test.js is red before the replacement and green after it.
- No existing file under src/ or test/ changes.
- `npm --prefix . run test` passes.
