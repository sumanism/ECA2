# ADR 001: Flow Orchestration Design

## Status
Accepted

## Context
We need to design a system for executing multi-step email sequences (flows) that can be triggered by various customer events. The system must support:
- Different entry conditions (signup, purchase, cart abandonment, etc.)
- Multiple step types (email, wait, push notification, exit)
- Ordered execution with delays between steps
- Association with customer segments

## Decision
We will implement flows as separate entities linked to segments (one-to-one relationship), with ordered steps stored in a separate `FlowStep` table. Each step has:
- `step_type`: SEND_EMAIL | WAIT | SEND_PUSH | EXIT
- `step_order`: Integer for ordering
- `config`: JSON field for step-specific configuration
- `next_step_id`: Optional reference to next step (for complex flows)

## Rationale
1. **Separation of Concerns**: Flows are independent of campaigns, allowing reuse
2. **Segment-Flow Relationship**: One flow per segment ensures targeted messaging
3. **Flexible Configuration**: JSON config allows different step types without schema changes
4. **Ordered Execution**: `step_order` ensures predictable execution sequence

## Alternatives Considered

### Alternative 1: Flows as Campaign Steps
- **Pros**: Simpler model, fewer tables
- **Cons**: Cannot reuse flows across campaigns, tight coupling

### Alternative 2: Flow as JSON in Segment
- **Pros**: Single table, no joins
- **Cons**: Difficult to query, no referential integrity, harder to manage

## Consequences
- ✅ Flows can be created independently and associated with campaigns
- ✅ Easy to add new step types by extending config schema
- ✅ Clear separation between flow definition and execution
- ⚠️ Requires joins to fetch complete flow structure
- ⚠️ JSON config requires validation at application level

## Implementation Notes
- Flow steps are validated on creation
- Step order must be sequential (1, 2, 3, ...)
- EXIT steps terminate the flow
- WAIT steps use `duration_days` from config
