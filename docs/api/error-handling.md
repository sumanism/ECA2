# Error Handling

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST (creation) |
| 400 | Bad Request | Invalid request data |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server error |

## Error Response Format

```json
{
  "detail": "Error message description"
}
```

## AI Service Errors

AI service errors return structured error information:

```json
{
  "error": "quota_exceeded" | "authentication_error" | "api_error",
  "message": "User-friendly error message",
  "details": "Additional details",
  "retry_after": 60,  // seconds (for rate limits)
  "help_url": "https://..."
}
```

## Common Error Scenarios

### 1. Missing Resource
```json
{
  "detail": "Segment not found"
}
```
**Status**: 404

### 2. Validation Error
```json
{
  "detail": "Invalid campaign status. Must be one of: draft, active, paused, completed"
}
```
**Status**: 400

### 3. AI API Error
```json
{
  "error": "quota_exceeded",
  "message": "API rate limit or quota exceeded. Please wait before trying again.",
  "details": "The API has rate limits based on your plan.",
  "retry_after": 60,
  "help_url": "https://platform.openai.com/docs/guides/rate-limits"
}
```
**Status**: 500 (with structured error body)

### 4. Database Error
```json
{
  "detail": "Database connection error"
}
```
**Status**: 500

## Error Handling Best Practices

1. **User-Friendly Messages**: Errors should be understandable by end users
2. **Structured Errors**: AI errors include actionable information
3. **Retry Logic**: Rate limit errors include retry recommendations
4. **Logging**: All errors are logged server-side for debugging
