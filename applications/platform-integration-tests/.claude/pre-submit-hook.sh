#!/bin/bash

# Pre-submit hook for Claude Code
# Enforces development principles and guidelines

# Read input JSON from stdin
input=$(cat)
prompt=$(echo "$input" | jq -r '.prompt')

# Development principles to enforce
principles='
# Development Principles & Guidelines

Before proceeding, ensure you follow these principles:

1. **No Magic Strings**: Use constants, enums, or variables instead of hardcoded strings
2. **No Backwards Compatibility**: Focus on the current implementation without legacy support
3. **Think Deeply**: Analyze the problem thoroughly before implementing
4. **Do Not Over-Engineer**: Keep solutions simple and maintainable
5. **Reuse Existing Functionality**: Extract and share common functionality across the codebase
6. **Domain Driven Architecture**: Organize code by business domains
7. **Test Driven Development**: Write tests first based on your understanding, then implement to make tests pass
8. **Analyze Existing Functionality**: During planning, review existing code to understand patterns and reuse opportunities

When implementing:
- Write tests FIRST that describe the expected behavior
- Then implement the functionality to make tests pass
- Iterate until tests work as expected
- Extract reusable functionality to shared locations
- Use constants/enums for any string or numeric literals
'

# Output JSON with additional context
jq -n \
  --arg context "$principles" \
  '{
    "decision": null,
    "hookSpecificOutput": {
      "hookEventName": "UserPromptSubmit",
      "additionalContext": $context
    }
  }'
