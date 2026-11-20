<!-- Written by hydraflow from the adr_enforcement standard the installed CLI carries; an edit here is replaced the next time it writes this page. -->

# ADR enforcement

This repository is held to this: an accepted architecture decision record names the check that enforces it, or says plainly that its enforcement is planned or exempt.

## The rules it runs here

- **status-is-not-declared**: every record carries a Status line naming one of the declared statuses. To fix one: give the record a Status line naming one of the statuses the page lists.
- **accepted-without-enforcement**: an Accepted record carries at least one enforcement section with at least one entry. To fix one: add an Enforced-by section naming the check that holds the decision, or a Planned-enforcement or Enforcement-exempt section saying what will hold it or why nothing can, each entry a list item whose first backticked token names it.
- **enforcement-is-not-specific**: every Enforced-by entry names, in backticks, the check that holds the decision; on this repository what it names is not looked up, only that it names something. To fix one: put the name of the check, or the test as path::test_name, in backticks at the start of the entry.
- **planned-enforcement-is-not-planned**: every Planned-enforcement entry names, in backticks, what will hold the decision; on this repository what it names is not looked up, only that it names something. To fix one: put the name of the check or the file that will hold the decision in backticks at the start of the entry, with the milestone it is planned for.
- **consequence-is-empty**: every record states the consequence it accepted, at more than placeholder length. To fix one: add a Consequence section saying what the decision costs and what follows from it.
- **supersedes-names-a-missing-record**: every ADR-NNNN a supersedes clause names resolves to a record that exists. To fix one: name the record it replaces by the number its file carries, or say what it replaces without an ADR number when that was never a record.
- **exemption-is-not-stated**: an Enforcement-exempt entry names an artefact that exists and states its reason at length. To fix one: name, in backticks, a file or folder that exists in this repository, and say after it why no check can reach the decision.
- **retired-gate-is-unnamed**: a record's Retires line names the gate it takes out of the path. To fix one: name the gate after Retires:, or take the line out.
- **retired-gate-catch-is-unstated**: a record that retires a gate states what the gate caught that nothing now catches, at no less than consequence_min_chars. To fix one: add the section the page names for a retired gate, saying what the gate caught that nothing now catches.

## How it is held

The count each rule found in each file when adr_enforcement was switched on is kept in tests/architecture/adr_enforcement_baseline.json. hydraflow line-layout check measures again and refuses a rise in any file's count for any rule, naming each finding and how it is fixed, and never refuses a fall. Lowering the count is welcome and nothing raises it.

## Writing a record

A record is a markdown file directly under the folder .hydraflow/layout.yaml names as its adrs root (docs/adr when hydraflow init drafted it), named with its number and a slug, such as 0003-a-short-title.md, the number never reused. A repository with no records yet is green; the first is written this way too.

- It carries a line starting Status: and naming one of Proposed, Accepted, Superseded, Rejected.
- It carries a section headed Consequence of at least 40 characters.
- A record that is Accepted carries at least one of the sections Enforced-by, Planned-enforcement, Enforcement-exempt, with at least one list item. The first backticked token of an item is what it names; the rest of the item is commentary.
- An Enforcement-exempt item names a file or folder that exists in this repository and says why no check reaches the decision, in at least 60 characters.
- A record that supersedes another names it as ADR- and its four-digit number, and that record is here.
- A record that takes a gate out of the path carries a Retires: line naming it, and a section headed What it caught that nothing now catches of at least 40 characters.

Here an Enforced-by or Planned-enforcement item has to name something in backticks, and what it names is not looked up.

## What is not run here

Every other rule of the adr_enforcement standard is declared not applicable in this repository's layout: each reads the factory's charter, plans, article tiers or exemption baseline, or resolves an enforcing test in the factory's tree, so here an Enforced-by or Planned-enforcement entry is held to naming something in backticks and what it names is not looked up.
