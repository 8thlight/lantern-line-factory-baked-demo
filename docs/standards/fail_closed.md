<!-- Written by hydraflow from the fail_closed standard the installed CLI carries; an edit here is replaced the next time it writes this page. -->

# Fail closed

This repository is held to this: every failure path denies or names itself: an error handler returns nothing permissive, and a choice over a closed set ends in a refusal rather than falling through.

## The rules it runs here

- **permissive-rescue**: no error handler answers an error with a value that lets the caller carry on as if nothing failed: an except or catch whose whole body is nothing, or one return of a permissive value. To fix one: let the error reach the caller, catch it by a name of your own and refuse, or return a value the caller has to treat as a failure.
- **generic-exception-refusal**: every refusal raises an error a caller can catch by name, never one of the built-in names generic_exceptions lists. To fix one: define a named error for this refusal and raise that, so a caller can catch exactly this one.
- **file-not-parseable**: every file a reader reads can be read, because a file it cannot follow is one every rule silently stops measuring. To fix one: make the file read cleanly, or move what the reader cannot follow into a file it can; a file present when the standard was switched on is counted and only a new one is red.

## How it is held

The count each rule found in each file when fail_closed was switched on is kept in tests/architecture/fail_closed_baseline.json. hydraflow line-layout check measures again and refuses a rise in any file's count for any rule, naming each finding and how it is fixed, and never refuses a fall. Lowering the count is welcome and nothing raises it.

## What it counts

In Python a handler permits when it returns one of False, None, True, 0, '', or passes. In JavaScript a catch block permits when it is empty, returns nothing, or returns one of false, null, true, 0, "", undefined, [], {}. A refusal raising one of ValueError, RuntimeError, TypeError, KeyError, Exception is a refusal nobody can catch by name.

## What each reader measures

- **python** (.py): read with ast, the factory's own reader: every except handler whose body, its docstring dropped, is one pass or one return of a value permissive_values lists, and every raise of a call to a name generic_exceptions lists.
  - not measured: a handler that does anything more than that one statement, such as logging and then returning a permissive value.
  - not measured: a file larger than the code_craft line block's largest_file_bytes is not read past it, and a tracked symbolic link is not followed; each is one file-not-parseable finding.
- **javascript** (.js, .mjs, .cjs): read through the factory's line-based reader with comments blanked and literals made inert: every catch block after a try, with or without its binding, whose body holds no code or is one return of nothing (a value on the next line included, as JavaScript reads it), of a JavaScript spelling of a value permissive_values lists, or of one permissive_literals lists.
  - not measured: a throw of a built-in Error, so generic-exception-refusal is counted in Python only.
  - not measured: a promise's .catch handler, and a callback that swallows its error argument.
  - not measured: a catch block that does anything more than that one return, such as logging first or returning inside an if.
  - not measured: a returned value that is anything but a bare literal, such as one in parentheses or a variable holding one.
  - not measured: a file larger than the code_craft line block's largest_file_bytes is not read past it, and a tracked symbolic link is not followed; each is one file-not-parseable finding.
  - not measured: TypeScript and JSX files are not read.

## What is not run here

Every other rule of the fail_closed standard is declared not applicable in this repository's layout: each reads the factory's own declarations, refusal sites or schemas, or judges a Python shape (a chain over a closed set, a soft read of a key) no line reader reads in every language yet, and a line runs only the rules the fail_closed standard's line block names.
