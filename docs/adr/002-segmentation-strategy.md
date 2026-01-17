# ADR 002: Segmentation Strategy

## Status
Accepted

## Context
Customer segmentation is core to the CDP. We need a flexible system that supports:
- Multiple criteria per segment
- Logical operators (AND/OR)
- Various field types (numeric, string, date, boolean)
- Relative date calculations
- Real-time evaluation

## Decision
Segments use a JSON-based criteria structure stored in the `definition` field:

```json
{
  "logical_operator": "AND" | "OR",
  "criteria": [
    {
      "field": "field_name",
      "operator": "gt" | "lt" | "eq" | "contains" | "gte" | "lte",
      "value": <value>
    }
  ]
}
```

## Rationale
1. **Flexibility**: JSON allows dynamic criteria without schema changes
2. **Extensibility**: Easy to add new operators or fields
3. **Human-Readable**: Criteria structure is clear and debuggable
4. **AI-Friendly**: Structure works well with AI generation

## Alternatives Considered

### Alternative 1: Separate Criteria Table
- **Pros**: Normalized, queryable
- **Cons**: Complex joins, harder to manage, slower evaluation

### Alternative 2: SQL WHERE Clause Storage
- **Pros**: Direct SQL execution
- **Cons**: Security risk (SQL injection), less flexible, harder to validate

## Consequences
- ✅ Easy to add new criteria without migration
- ✅ AI can generate criteria structure directly
- ✅ Supports complex logical combinations
- ⚠️ Requires custom evaluation logic (not pure SQL)
- ⚠️ JSON validation needed at application level

## Implementation Details

### Supported Fields
- `total_order_value` (numeric)
- `order_count` (numeric)
- `days_since_last_order` (numeric, calculated)
- `last_order_date` (date, supports relative dates)
- `shipping_state` (string)
- `shipping_country` (string)
- `email` (string)
- `marketing_opt_in` (boolean)

### Supported Operators
- `gt`: Greater than
- `lt`: Less than
- `gte`: Greater than or equal
- `lte`: Less than or equal
- `eq`: Equals
- `contains`: String contains (case-insensitive)

### Relative Dates
For `last_order_date`, supports relative date calculations:
- `relative_7`: 7 days ago
- `relative_30`: 30 days ago
- `relative_60`: 60 days ago
- `relative_90`: 90 days ago
