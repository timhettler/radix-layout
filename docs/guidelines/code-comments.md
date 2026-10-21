# Code comments

The authority on what a comment says, whether a person or an agent writes it.
`CLAUDE.md` has the short form. No tooling checks any of this, which is why it
is prose.

## What a comment is for

Assume a senior engineer reading the code for the first time, and that no
comment is needed. A comment earns its place with a current fact the code,
types, names, tests and structure don't carry:

- why the code takes an unusual shape, or an external constraint: an API,
  protocol, data format, runtime or platform;
- an invariant or precondition that is easy to break and hard to infer;
- an edge case or correctness requirement: ordering, concurrency, security,
  compatibility, precision, performance;
- a workaround that is still needed, stated as the present condition;
- intentional behaviour that looks like a bug.

## What to cut

- A description of the next statement, and a prose version of a name or a type.
- A heading over a short, obvious block.
- An announcement of ordinary error handling, validation, iteration, parsing,
  logging or cleanup.
- Development history: "used to", "previously", "after the refactor". The
  commit, the PR and the ADRs hold history. Keep only a constraint that still
  holds, stated as one.
- A value that will drift, such as a count, a past measurement or a date, unless
  a current contract depends on it. Prefer a named constant, or words like
  _bounded_ or _rare_.
- A comment that exists because the code is hard to read. That is a note about
  the code: a clearer name, a constant or a smaller function removes it.

## Point at the doc that owns the reason

Where a doc holds the rationale, link it with a stable repository path rather
than summarizing it. Keep the constraint itself, in one sentence, where a
maintainer would otherwise break it: a bare link reads as complete, so nobody
opens the doc.

## Comments that are part of the program

Find out what reads a comment before you cut it: compiler and bundler
directives, lint and type-checker suppressions, coverage directives, codegen
markers, doc comments a tool publishes, licence headers and shebangs.

## TODOs and warnings

A TODO names a concrete problem that still applies, or it goes. A warning states
the exact invariant or consequence; a bare "IMPORTANT" or "HACK" says nothing.

## Length and the final test

As short as the idea allows; one precise sentence is usually enough. A longer
block is only for a constraint that needs several facts and has no doc. Keep a
comment only if removing it would make a maintainer more likely to break
something the code doesn't show.
