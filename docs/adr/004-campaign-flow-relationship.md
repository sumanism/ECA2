# ADR 004: Campaign-Flow-Segment Relationship

## Status
Accepted

## Context
We need to define how Campaigns, Flows, and Segments relate to each other. The relationship affects:
- How campaigns target customers
- How flows are executed
- How AI generates campaign strategies

## Decision

### Relationship Model:
```
Segment (1) ──< (1) Flow
Segment (1) ──< (*) Campaign
Campaign (*) ──> (0..1) Flow (optional)
```

**Key Rules:**
1. **Flow → Segment**: One-to-one (each segment can have one flow)
2. **Campaign → Segment**: Many-to-one (campaigns target a segment)
3. **Campaign → Flow**: Many-to-zero-or-one (campaigns can optionally use a flow)

### Rationale:
- **Flows are segment-specific**: Flows define behavior for a segment, not a campaign
- **Campaigns can reuse flows**: Multiple campaigns can use the same flow
- **Flexibility**: Campaigns can run with or without flows

## Alternatives Considered

### Alternative 1: Flow → Campaign (One-to-One)
- **Pros**: Simpler model
- **Cons**: Cannot reuse flows, tight coupling

### Alternative 2: Campaign → Flow (Many-to-One)
- **Pros**: Flows independent of segments
- **Cons**: Flows should be segment-aware for personalization

## Consequences
- ✅ Flows are segment-aware (better personalization)
- ✅ Campaigns can run standalone or with flows
- ✅ Multiple campaigns can share a flow
- ⚠️ Flow creation requires segment selection
- ⚠️ Need to validate flow-segment match when associating with campaign

## Implementation Notes
- Flow creation requires `segment_id` (not optional)
- Campaign `flow_id` is optional
- When AI generates campaigns, it considers both segment and flow (if provided)
- Flow entry conditions are segment-specific events
