<!-- Written by hydraflow from the domain_entities standard the installed CLI carries; an edit here is replaced the next time it writes this page. -->

# Domain entities

This repository's code is held to this: a change reaches the tests of its own domain entity and not those of every other: each entity owns its address, its repository interface and, where work must survive a restart, its queue. Here it runs the part of that a repository of its own can be read for: no module is imported by more of the tree than the count it had.

## The rules it runs here

- **hub-module**: A module over the importer ceiling with outbound local production dependencies is a hub. New hubs are refused; leaf vocabulary has no outbound domain dependencies. To fix one: split the module by what its importers use it for, so each importer imports only the part it needs, or move the imports it makes of the tree out, which leaves it leaf vocabulary every file may share.
- **hub-count-rose**: A baselined hub's importer count rose. The baseline is shrink-only: a rise is the defect the ratchet exists to catch, and raising the number to go green is the same defect wearing a fix's clothes. To fix one: import what the new importer needs from a smaller module of its own, or split the hub so the new importer reaches only the part it uses.
- **graph-incomplete**: A file in the declared scope could not be read or parsed, so no importer count can be trusted and nothing is judged. Fail closed: an incomplete graph UNDER-counts, and an under-count reads as a module having fewer importers than it has, which would let the ratchet accept a hub growing. To fix one: make the file read cleanly; no importer count can be trusted while one file of the tree cannot be read, so nothing is judged until it is.

## How it is held

Every file of the tree in a language read below is a module, named by its path, tests among them: a test that imports a module is one more file a change to it reaches. Each module importing another of the tree that more than 100 files imported when domain_entities was switched on is kept with its count in tests/architecture/domain_entities_baseline.json, and hydraflow line-layout check refuses its count rising. Every other module that imports another of the tree is held to the ceiling of 100 importers; one that imports nothing of the tree is vocabulary every file may share, and is held to nothing. A fall is never refused. A file that cannot be read stops the check, because an import graph missing a file under-counts. The one exception is a file larger than the 1048576 bytes a line scan reads: it is not read, it stays a module the others may import, and its own imports are not counted, so a committed bundle neither stalls the check nor stops it.

## How an import is resolved

- **python** (.py): read with ast, through the same reader as this repository's own import graph: each file is a module named by its path from the checkout, a leading src folder taken off and a package named by its folder; each import names a module of the tree when its dotted name, or the dotted name of what a from-import brings in, is one, a relative import resolved against the file's own package.
  - not resolved: a module the project installs from elsewhere, or a third-party package, is not a module of the tree.
  - not resolved: an import made at run time (importlib, __import__) is not read.
  - not resolved: a tree with more than one source root besides src names a module by its path from the checkout.
  - not resolved: a file holding a dotted name of more parts than the code_craft line block's longest_dotted_name is not parsed, and the graph is refused as incomplete.
  - not resolved: two files naming one module, one under src and one beside it, are refused by name.
  - not resolved: {'a tracked link is not followed': 'it is no module, and nothing is read through it'}.
  - not resolved: {"a file larger than the code_craft line block's largest_file_bytes is not read": 'it is still a module others may import, and its own imports are not counted'}.
- **javascript** (.js, .mjs, .cjs): read through the factory's line-based reader with comments blanked and literals made inert: each import, export-from, dynamic import or require of a relative specifier, starting ./ or ../, resolved from the importing file's folder to the tracked file it names, as written, then with .js, .mjs or .cjs added, then as a folder's index file.
  - not resolved: a bare specifier names a package, not a module of the tree, and is not counted.
  - not resolved: an absolute specifier, a URL, an import map, a bundler alias or a package.json exports field is not resolved.
  - not resolved: a specifier in a template literal, or passed through a variable, is not read.
  - not resolved: TypeScript and JSX files are not read.
  - not resolved: {'a tracked link is not followed': 'it is no module, and nothing is read through it'}.
  - not resolved: {"a file larger than the code_craft line block's largest_file_bytes is not read": 'it is still a module others may import, and its own imports are not counted'}.

## What is not run here

Every other rule of the domain_entities standard is declared not applicable in this repository's layout (baseline-names-a-module-that-is-gone, context-import-opaque, context-inventory-incomplete, context-outbound-unowned, domain-verification-underclassified, durable-work-unbound, entity-imports-shared-address, private-context-import, repository-owner-bypassed, shared-vocabulary-coupled, test-support-cycle, test-support-layer-inverted): it reads the factory's declared bounded contexts, aggregate repositories, durable queues, test-support layers or shared addresses, which a line declares none of, or it asks a recorded count to be taken out by hand, where a line's count is written once and a module gone is a fall.

## Switching it on

In .hydraflow/layout.yaml, replace the standard's not_applicable with this entry:

    standards:
      domain_entities:
        reads:
        - checkout
        not_applicable_rules:
          baseline-names-a-module-that-is-gone: 'not run on a line: it reads the factory''s declared bounded contexts, aggregate repositories, durable queues, test-support layers or shared addresses, which a line declares none of, or it asks a recorded count to be taken out by hand, where a line''s count is written once and a module gone is a fall'
          context-import-opaque: 'not run on a line: it reads the factory''s declared bounded contexts, aggregate repositories, durable queues, test-support layers or shared addresses, which a line declares none of, or it asks a recorded count to be taken out by hand, where a line''s count is written once and a module gone is a fall'
          context-inventory-incomplete: 'not run on a line: it reads the factory''s declared bounded contexts, aggregate repositories, durable queues, test-support layers or shared addresses, which a line declares none of, or it asks a recorded count to be taken out by hand, where a line''s count is written once and a module gone is a fall'
          context-outbound-unowned: 'not run on a line: it reads the factory''s declared bounded contexts, aggregate repositories, durable queues, test-support layers or shared addresses, which a line declares none of, or it asks a recorded count to be taken out by hand, where a line''s count is written once and a module gone is a fall'
          domain-verification-underclassified: 'not run on a line: it reads the factory''s declared bounded contexts, aggregate repositories, durable queues, test-support layers or shared addresses, which a line declares none of, or it asks a recorded count to be taken out by hand, where a line''s count is written once and a module gone is a fall'
          durable-work-unbound: 'not run on a line: it reads the factory''s declared bounded contexts, aggregate repositories, durable queues, test-support layers or shared addresses, which a line declares none of, or it asks a recorded count to be taken out by hand, where a line''s count is written once and a module gone is a fall'
          entity-imports-shared-address: 'not run on a line: it reads the factory''s declared bounded contexts, aggregate repositories, durable queues, test-support layers or shared addresses, which a line declares none of, or it asks a recorded count to be taken out by hand, where a line''s count is written once and a module gone is a fall'
          private-context-import: 'not run on a line: it reads the factory''s declared bounded contexts, aggregate repositories, durable queues, test-support layers or shared addresses, which a line declares none of, or it asks a recorded count to be taken out by hand, where a line''s count is written once and a module gone is a fall'
          repository-owner-bypassed: 'not run on a line: it reads the factory''s declared bounded contexts, aggregate repositories, durable queues, test-support layers or shared addresses, which a line declares none of, or it asks a recorded count to be taken out by hand, where a line''s count is written once and a module gone is a fall'
          shared-vocabulary-coupled: 'not run on a line: it reads the factory''s declared bounded contexts, aggregate repositories, durable queues, test-support layers or shared addresses, which a line declares none of, or it asks a recorded count to be taken out by hand, where a line''s count is written once and a module gone is a fall'
          test-support-cycle: 'not run on a line: it reads the factory''s declared bounded contexts, aggregate repositories, durable queues, test-support layers or shared addresses, which a line declares none of, or it asks a recorded count to be taken out by hand, where a line''s count is written once and a module gone is a fall'
          test-support-layer-inverted: 'not run on a line: it reads the factory''s declared bounded contexts, aggregate repositories, durable queues, test-support layers or shared addresses, which a line declares none of, or it asks a recorded count to be taken out by hand, where a line''s count is written once and a module gone is a fall'

then run

    hydraflow line-layout baseline --standard domain_entities

and commit the count and this page it writes in the same change as the switch.
