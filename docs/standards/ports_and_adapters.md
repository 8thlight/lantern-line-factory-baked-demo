<!-- Written by hydraflow from the ports_and_adapters standard the installed CLI carries; an edit here is replaced the next time it writes this page. -->

# Ports and adapters

This repository's code is held to this: every boundary where the code does input or output is an interface with a fake that satisfies it, and a real adapter is constructed only at a declared composition site. Here it runs the part of that a repository of its own can be read for: input and output stay at the edges it declares.

## The rules it runs here

- **io-outside-the-adapters**: a module outside the adapters the line declares does no input or output, so the code that decides can be tested without the world behind it. To fix one: move the input or output into a module under the adapters the line declares and pass what it reads, or a function that does it, into the code that decides.
- **file-not-parseable**: every file the scan reads can be read, because a file it cannot follow is one whose input and output are not counted. To fix one: make the file read cleanly, or move what the reader cannot follow into a file it can; a file present when the standard was switched on is counted and only a new one is red.

## The adapters

This repository names its adapters under adapters in .hydraflow/layout.yaml: each a path inside the checkout naming a file, or a folder and everything in it. A module there may do input or output, and so may a test. Every other module that does is counted, once per use. A layout that names none is refused by name, with the step that names them, and so is an adapter naming the whole checkout, or adapters holding every file there is to read.

## How it is held

The count each rule found in each file when ports_and_adapters was switched on is kept in tests/architecture/ports_and_adapters_baseline.json. hydraflow line-layout check reads the code again and refuses a rise in any file's count for any rule, naming each use with its line, and never refuses a fall. Lowering the count is welcome and nothing raises it.

## What counts as input or output

Exactly these names, and no other:

- **python** (.py): read with ast: each import of one of the modules named, or of a module under one; each call of one of the built-in functions named; and each use of one of the attributes named, written as the module's own name, a dot and the attribute, or imported from the module by its name. These count:
  - an import of socket, ssl, subprocess, urllib, http, requests, httpx, aiohttp, ftplib, smtplib, sqlite3.
  - a call of open, input.
  - a use of os.environ, os.getenv, os.putenv, os.system, os.popen, sys.stdin.
  - limit: a module imported under another name and then used (import os as system, then system.environ) is not followed past its import.
  - limit: a method call on an object, such as a path's read_text or a client's get, is not counted, because a reader with no types cannot say what the object is.
  - limit: print and logging are not counted.
  - limit: a function of the module's own that shadows a built-in named (one called open) is still counted when it is called.
  - limit: a file holding a dotted name of more parts than the code_craft line block's longest_dotted_name is not parsed, and is one file-not-parseable finding.
  - limit: a tracked link is not followed, and nothing is read through it.
  - limit: a file larger than the code_craft line block's largest_file_bytes is not read past it, and is one file-not-parseable finding.
- **javascript** (.js, .mjs, .cjs): read through the factory's line-based reader with comments blanked and literals made inert: each import, export-from, dynamic import or require whose module is one of the modules named, with or without the node: prefix and with any subpath (fs/promises counts as fs); each use of one of the globals named, written as a bare name; and each use of one of the attributes named, written as its object, a dot and the property. These count:
  - an import of fs, net, http, https, http2, child_process, dgram, tls, readline.
  - a use of fetch, document, window, localStorage, sessionStorage, XMLHttpRequest, WebSocket.
  - a use of process.env.
  - limit: a global reached through another object (globalThis.fetch, self.localStorage) or by a computed name is not counted.
  - limit: a bare name is counted wherever it is written as code, so a property key, a parameter or a local variable spelled as one of the globals is counted too.
  - limit: a module named inside a template literal, or required through a variable, is not counted.
  - limit: code inside a template literal's placeholders is not read.
  - limit: a regular expression literal keeps its letters, so a name spelled inside one is counted as if it were code.
  - limit: TypeScript and JSX files are not read.
  - limit: a tracked link is not followed, and nothing is read through it.
  - limit: a file larger than the code_craft line block's largest_file_bytes is not read past it, and is one file-not-parseable finding.

## What is not run here

Every other rule of the ports_and_adapters standard is declared not applicable in this repository's layout (adapter-imported-outside-composition-root, composition-root-does-not-construct-port, contract-corpus-reaches-out-of-scope, contract-does-not-cover-the-method, contract-does-not-exercise-a-refusal, fake-does-not-satisfy-port, no-fake-survives-power-on, port-has-no-fake, port-has-two-implementations-and-no-contract, port-is-not-runtime-checkable, readme-port-table-drift): it reads the factory's own ports package, fakes, composition roots or contract tests, which a line declares none of.

## Switching it on

In .hydraflow/layout.yaml, name the adapters and replace the standard's not_applicable with this entry:

    adapters:
    - <a file or folder that does input or output>
    standards:
      ports_and_adapters:
        reads:
        - checkout
        not_applicable_rules:
          adapter-imported-outside-composition-root: 'not run on a line: it reads the factory''s own ports package, fakes, composition roots or contract tests, which a line declares none of'
          composition-root-does-not-construct-port: 'not run on a line: it reads the factory''s own ports package, fakes, composition roots or contract tests, which a line declares none of'
          contract-corpus-reaches-out-of-scope: 'not run on a line: it reads the factory''s own ports package, fakes, composition roots or contract tests, which a line declares none of'
          contract-does-not-cover-the-method: 'not run on a line: it reads the factory''s own ports package, fakes, composition roots or contract tests, which a line declares none of'
          contract-does-not-exercise-a-refusal: 'not run on a line: it reads the factory''s own ports package, fakes, composition roots or contract tests, which a line declares none of'
          fake-does-not-satisfy-port: 'not run on a line: it reads the factory''s own ports package, fakes, composition roots or contract tests, which a line declares none of'
          no-fake-survives-power-on: 'not run on a line: it reads the factory''s own ports package, fakes, composition roots or contract tests, which a line declares none of'
          port-has-no-fake: 'not run on a line: it reads the factory''s own ports package, fakes, composition roots or contract tests, which a line declares none of'
          port-has-two-implementations-and-no-contract: 'not run on a line: it reads the factory''s own ports package, fakes, composition roots or contract tests, which a line declares none of'
          port-is-not-runtime-checkable: 'not run on a line: it reads the factory''s own ports package, fakes, composition roots or contract tests, which a line declares none of'
          readme-port-table-drift: 'not run on a line: it reads the factory''s own ports package, fakes, composition roots or contract tests, which a line declares none of'
          readme-standard-drift: ports_and_adapters/standard.yaml marks this rule the kernel's own, and this line is not the kernel

then run

    hydraflow line-layout baseline --standard ports_and_adapters

and commit the count and this page it writes in the same change as the switch.
