# Environment Variables Setup

## Required: Create `.env` file

Create a file named `.env` in the `backend/` directory with the following content:

## Basic Configuration (Minimum Required)

```env
# REQUIRED: Your AI API Key (OpenAI SDK standard variable name)
OPENAI_API_KEY=your-api-key-here
```

## Full Configuration (With Optional Settings)

```env
# ============================================
# REQUIRED: API Key
# ============================================
# Use OpenAI SDK standard variable names (recommended):
OPENAI_API_KEY=your-api-key-here

# Alternative variable names (for backward compatibility):
# AI_API_KEY=your-api-key-here
# GEMINI_API_KEY=your-api-key-here

# ============================================
# OPTIONAL: Provider Configuration
# ============================================

# Base URL for the AI service endpoint (OpenAI SDK standard)
# Default: Gemini's OpenAI-compatible endpoint
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/

# Alternative: AI_BASE_URL (fallback)
# AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/

# Model name to use (OpenAI SDK standard)
# Default: gemini-2.5-flash
OPENAI_MODEL=gemini-2.5-flash

# Alternative: AI_MODEL (fallback)
# AI_MODEL=gemini-2.5-flash
```

## Example Configurations

### Google Gemini (Default)

```env
OPENAI_API_KEY=AIzaSy-your-gemini-api-key-here
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
OPENAI_MODEL=gemini-2.5-flash
```

**Get Gemini API Key**: https://aistudio.google.com/apikey

### OpenAI

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

**Get OpenAI API Key**: https://platform.openai.com/api-keys

### Other OpenAI-Compatible Providers

```env
OPENAI_API_KEY=your-provider-api-key
OPENAI_BASE_URL=https://api.your-provider.com/v1
OPENAI_MODEL=model-name
```

## Important Notes

1. **The `.env` file is gitignored** - Your API keys will NOT be committed to version control
2. **API Key is REQUIRED** - The application will raise an error if no API key is found
3. **No hardcoded keys** - All keys must be set via environment variables
4. **OpenAI SDK Standard Names** - The service uses OpenAI SDK standard environment variable names:
   - `OPENAI_API_KEY` (primary, SDK standard)
   - `OPENAI_BASE_URL` (primary, SDK standard)
   - `OPENAI_MODEL` (primary, SDK standard)
5. **Backward Compatibility** - The service also supports fallback variable names:
   - `AI_API_KEY` (fallback)
   - `AI_BASE_URL` (fallback)
   - `AI_MODEL` (fallback)
   - `GEMINI_API_KEY` (legacy fallback)

## Priority Order

The service checks for environment variables in this order:

1. **API Key**: `OPENAI_API_KEY` → `AI_API_KEY` → `GEMINI_API_KEY`
2. **Base URL**: `OPENAI_BASE_URL` → `AI_BASE_URL` → (default Gemini endpoint)
3. **Model**: `OPENAI_MODEL` → `AI_MODEL` → (default: gemini-2.5-flash)

## Error Handling

If you don't set an API key, you'll see this error when trying to use AI features:

```
ValueError: OPENAI_API_KEY is missing. Please set one of the following environment variables:
  - OPENAI_API_KEY (recommended, OpenAI SDK standard)
  - AI_API_KEY (fallback)
  - GEMINI_API_KEY (legacy fallback)
```

## Quick Setup

1. Create `backend/.env` file
2. Add your API key using OpenAI SDK standard name:
   ```env
   OPENAI_API_KEY=your-actual-api-key-here
   ```
3. (Optional) Configure base URL and model:
   ```env
   OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
   OPENAI_MODEL=gemini-2.5-flash
   ```
4. Restart the backend server
5. The AI service will automatically load your configuration

## OpenAI SDK Auto-Detection

The OpenAI SDK automatically reads these environment variables:
- `OPENAI_API_KEY` - API key
- `OPENAI_BASE_URL` - Base URL for the API endpoint

If you use the standard variable names, the SDK will automatically detect them without any additional configuration.
