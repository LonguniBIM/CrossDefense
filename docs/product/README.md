# Product Docs

This directory contains current consumer-product behavior derived from real
accepted intent. Harness deliberately ships no fake product domains.

When a user provides a product specification, derive smaller living documents
here instead of keeping one growing specification as the operating manual. Name
files after actual product domains, such as `overview.md`, `billing.md`,
`permissions.md`, or `api-conventions.md`.

## Current Product Contract

- [MVP_SPEC.md](MVP_SPEC.md): Approved Product Specification and MVP boundaries for the Vocabulary Ship Game. Covers gameplay loops, falling-block spelling mechanics, crossword ship construction, combat resolution, progression economy, and local-first boundaries.

## Update Rule

When behavior changes:

1. Update the affected product document when the expected behavior changed.
2. Update the active execution plan when complex work uses one.
3. Add a lasting decision only when future work must inherit a consequential
   product, architecture, data, security, compatibility, or validation choice.
4. Add or update executable proof that exercises the behavior.

Bounded changes do not require a parallel lifecycle record.
