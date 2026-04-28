---
inclusion: always
---

# Decision-Driven Document Generation

Before creating requirements.md, design.md, or tasks.md, create a decision file first.

## Requirements Phase

Before creating:

.kiro/specs/{spec-name}/requirements.md

Create first:

.kiro/decisions/{spec-name}/_decisions-requirements.md

Then stop and ask the user to review the decisions.

## Design Phase

Before creating:

.kiro/specs/{spec-name}/design.md

Create first:

.kiro/decisions/{spec-name}/_decisions-design.md

Then stop and ask the user to review the decisions.

## Tasks Phase

Before creating:

.kiro/specs/{spec-name}/tasks.md

Create first:

.kiro/decisions/{spec-name}/_decisions-tasks.md

Then stop and ask the user to review the decisions.

## Main Rule

Never create the decision file and the final document in the same response.

The user must review and complete the decision file first.

After the user confirms, generate the final document.

## Decision File Should Include

- Scope decisions
- Main features
- User roles
- Business rules
- Technical choices
- Implementation priorities
- Testing approach

## Language

Use the same language as the user's request.