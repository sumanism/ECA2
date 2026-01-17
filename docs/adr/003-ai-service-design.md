# ADR 003: AI Service Design (SOLID Principles)

## Status
Accepted

## Context
The AI service needs to support multiple providers (OpenAI, Gemini, etc.), handle errors gracefully, and be maintainable. The service was initially monolithic and needed refactoring.

## Decision
Apply SOLID principles with the following structure:

```
services/
├── interfaces.py          # Service interfaces (DIP, ISP)
├── ai_service.py         # Main AI service implementation
├── ai_client.py          # Client factory (SRP)
├── prompt_loader.py      # Prompt file loader (SRP)
└── ai_error_handler.py   # Error handler (SRP)
```

### Key Design Decisions:
1. **Single Responsibility**: Each module has one clear purpose
2. **Dependency Inversion**: Services depend on interfaces, not concrete implementations
3. **Interface Segregation**: Focused interfaces (IAIService, ISegmentService, etc.)
4. **Open/Closed**: Extensible through interfaces without modifying existing code

## Rationale
1. **Maintainability**: Clear separation of concerns makes code easier to understand and modify
2. **Testability**: Interfaces allow easy mocking for unit tests
3. **Extensibility**: New AI providers can be added by implementing interfaces
4. **Error Handling**: Centralized error handling improves user experience

## Alternatives Considered

### Alternative 1: Monolithic Service
- **Pros**: Simpler initial structure
- **Cons**: Hard to test, difficult to extend, violates SRP

### Alternative 2: Provider-Specific Services
- **Pros**: Clear provider separation
- **Cons**: Code duplication, harder to switch providers

## Consequences
- ✅ Easy to add new AI providers
- ✅ Better error messages for users
- ✅ Prompts stored in files (version-controlled, editable)
- ✅ Client initialization abstracted (supports multiple providers)
- ⚠️ More files to maintain
- ⚠️ Slightly more complex initial setup

## Implementation Details

### AIClientFactory
- Handles environment variable loading
- Creates OpenAI-compatible clients
- Supports custom `base_url` for different providers
- Auto-detects SDK standard environment variables

### PromptLoader
- Loads prompts from `backend/prompts/` directory
- Provides fallback prompts if files missing
- Single responsibility: file loading only

### AIErrorHandler
- Centralized error processing
- Provider-specific error messages
- User-friendly error formatting
- Retry logic recommendations
