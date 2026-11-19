# Standards

The house standards this line is held to, as hydraflow init switched them on. .hydraflow/layout.yaml says which are on and what each reads; every other standard is declared not_applicable there, with its reason.

## Switched on, at the tree's own count

- **hygiene**: total 0, measured at commit c59795fcdcd6, kept in tests/architecture/suppression_baseline.json.
- **testing**: negative-assertion-unpaired 0, substring-binding 0, measured at commit c59795fcdcd6, kept in tests/architecture/assertion_baseline.json.
  - javascript: negative-assertion-unpaired 0, substring-binding 0.

Each count was measured over this tree when the standard was switched on, so the tree arrived green. hydraflow line-layout check holds the line to it: a count may fall and never rise, and only a rise is red.

## Switching another on

Replace its not_applicable in .hydraflow/layout.yaml with the roots it reads, then run

    hydraflow line-layout baseline --standard <name>

and commit the count it writes in the same change as the switch.
