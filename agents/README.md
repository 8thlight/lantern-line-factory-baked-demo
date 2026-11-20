# Agents

These are the roles the HydraFlow factory takes when it builds Lantern Line. No person wrote
the game's code: each change went from a task in `work/` through research, plan, build,
verify, review and merge, and at each stage the factory works as one of the roles below. Each
file says who the role is, what it owes, how it decides, what it refuses, and the failure it
exists to prevent.

| Persona | Stage it serves | Responsibility |
| --- | --- | --- |
| [Product Manager](product-manager.md) | Research, plan | Is this worth building, and is the task's description of it true and testable |
| [Staff Designer](staff-designer.md) | Research, plan, verify | Screens first, and every screen change read against its artboard |
| [Senior Principal](senior-principal.md) | Plan, build | Keeps the game's rules pure and its seams where `node --test` can reach them |
| [Editor](editor.md) | Plan, review | The README, roadmap, tasks, ADRs and in-game copy read clearly to a stranger |
| [Evidence Reviewer](evidence-reviewer.md) | Verify | Watches the recorded build and files what a player would see go wrong |
| [Assurance Lead](assurance-lead.md) | Verify | Breaks the code to prove each test would catch it; ships nothing |
| [Review Loop](review_loop.md) | Review, merge | Approves only a change whose checks passed, and records why |
| [Devops](devops.md) | Merge | One pipeline from a merged change to the game people play |
