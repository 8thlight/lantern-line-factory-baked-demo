<!-- Written by hydraflow from the code_craft standard the installed CLI carries; an edit here is replaced the next time it writes this page. -->

# Code craft

This repository's code is held to this: the code stays small enough to hold in one head: short functions with few parameters, shallow nesting, and bounded classes and modules, counted against a baseline that may fall and never rise.

## The rules it runs here

- **too-many-parameters**: a function declares no more positional parameters than thresholds.positional_parameters and no more parameters in total than thresholds.total_parameters, with a leading self or cls not counted. Ceiling: positional_parameters 4, total_parameters 6. To fix one: group the parameters that travel together into one object, or split the function so each half needs fewer of them.
- **function-too-many-lines**: a function runs no more code lines than thresholds.function_lines, from its first line to its last with no blank, comment or docstring line counted, as a reader the line block declares measures it. Ceiling: function_lines 80. To fix one: move a step that has a name of its own into its own function and call it.
- **control-nested-too-deep**: a function nests its control blocks no deeper than thresholds.nesting_depth, a nested function measured on its own, as a reader the line block declares measures it. Ceiling: nesting_depth 3. To fix one: return early from the cases that end the work, or move the inner block into a function of its own.
- **module-too-long**: a module runs no more code lines than thresholds.module_lines, no blank, comment or docstring line counted, as a reader the line block declares measures it. Ceiling: module_lines 400. To fix one: move the functions that serve one purpose into a module of their own and import them.
- **file-not-parseable**: every file in scope parses, because a file the tree cannot be taken from is not measured at all. To fix one: make the file read cleanly, move what the reader cannot follow into a file it can, or stop tracking a generated or bundled file; a file present when the standard was switched on is counted and only a new one is red.

## How it is held

The count each rule found in each file when code_craft was switched on is kept in tests/architecture/code_craft_baseline.json. hydraflow line-layout check measures the code again and refuses a rise in any file's count for any rule, naming each function with what it measured and the ceiling, and never refuses a fall.

A change that moves a counted finding from one file to another (an over-long function split out into a module of its own, say) is a rise in the file it moved to. hydraflow line-layout baseline --standard code_craft --again records the count again at the tree as it stands, in the same change, only when no rule's count across the whole repository rose above the count held, and names the commit in the count it keeps; a new finding beside the move is still refused by name.

## What each reader measures

- **python** (.py): read with ast: every function at any depth, its parameters with a method's self or cls and a star parameter not counted, its code lines from its first decorator to its last line with no blank, comment or docstring line, and how deep its if, for, while, try, with and match blocks nest, an elif at its if's own level and a nested function measured on its own.
  - not measured: a lambda, which is an expression rather than a function with a body.
  - not measured: a file whose longest dotted name joins more than longest_dotted_name names is not parsed, and is counted as a file-not-parseable finding instead.
- **javascript** (.js, .mjs, .cjs): read through the factory's line-based reader with comments blanked and literals made inert: every function declaration and expression, arrow function and method shorthand, its parameters by the top-level commas of its parentheses (a destructured object or array is one, a rest parameter is not counted), its code lines from its first line to its closing brace, and how deep its braced if, else, for, while, do, switch, try, catch and finally blocks nest, a nested function measured on its own.
  - not measured: an arrow function with an expression body has its parameters counted and no length or nesting.
  - not measured: a control statement written without braces adds no depth.
  - not measured: code inside a template literal's placeholders is not read, and a template literal nested inside a placeholder can end the outer one early, so the file may be misread or unreadable.
  - not measured: a regular expression literal straight after a keyword such as return is read as division, so one holding a bracket or a slash can make the file unreadable.
  - not measured: a method named by a computed key or a string is not found.
  - not measured: a file larger than largest_file_bytes is not read past it, and a tracked symbolic link is not followed; each is counted as a file-not-parseable finding instead.
  - not measured: TypeScript and JSX files are not read.

## The limits of a reader

A file larger than 1048576 bytes is not read past that, and a Python file whose longest dotted name joins more than 256 names is not parsed: each is one file-not-parseable finding, named, so a committed bundle or a crafted file cannot stall the check.

## What is not run here

Every other rule of the code_craft standard is declared not applicable in this repository's layout: each reads the factory's own declarations or its Python surface across modules, and a line runs only the rules the code_craft standard's line block names.
