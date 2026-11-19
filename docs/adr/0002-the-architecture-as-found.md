# ADR-0002 — The architecture as found

Status: **Accepted** · 2026-11-18 · written by hydraflow init

## Context

hydraflow init read this repository when it set the line up, before it changed anything. Each fact below is one it detected, stated as found.

## As found

- **Languages**, read off the manifests: javascript.
- **Top-level folders git tracks**: .hydraflow, design, docs, src, test, work.
- **Test command found**: npm --prefix . run test, run at the root.
- **Toolchains the sandbox recipe (Dockerfile.sandbox) builds with**: node.

## To be written

- What each folder is for, and which way dependencies between them run.
- Its entry points: no pyproject.toml script and no package.json main or bin names one.
- The decisions that shaped the tree, each as its own ADR from ADR-0003.

## Decision

The architecture is recorded as found and changed only by a later ADR that names what it changes.
