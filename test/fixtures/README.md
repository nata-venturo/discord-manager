# Test Fixtures

This directory contains static test data files used across the test suite.

## Files

### aiModels.json
Mock AI models configuration for testing AI service integration.

**Usage:**
```javascript
import aiModels from '../fixtures/aiModels.json' assert { type: 'json' };
```

### languages.json
Mock language configuration for testing translation services.

**Usage:**
```javascript
import languages from '../fixtures/languages.json' assert { type: 'json' };
```

### badWords.json
Mock bad words configuration for testing moderation service.

**Usage:**
```javascript
import badWords from '../fixtures/badWords.json' assert { type: 'json' };
```

### quotes.json
Mock quotes data for testing quote mode functionality.

**Usage:**
```javascript
import quotes from '../fixtures/quotes.json' assert { type: 'json' };
```

### warnings.json
Mock user warnings data for testing warning repository.

**Usage:**
```javascript
import warnings from '../fixtures/warnings.json' assert { type: 'json' };
```

## Best Practices

1. **Keep Data Realistic**: Use data that represents real-world scenarios
2. **Keep Files Small**: Only include necessary test data
3. **Document Structure**: Add comments for complex data structures
4. **Version Control**: Commit fixture files to git
5. **Avoid Sensitive Data**: Never include real tokens, passwords, or PII

## Creating New Fixtures

When adding new fixture files:

1. Create JSON file with descriptive name
2. Add realistic test data
3. Document the structure in this README
4. Use in tests via JSON import
5. Update related test files

Example:
```javascript
// In your test file
import myFixture from '../fixtures/myFixture.json' assert { type: 'json' };

describe('My Test', () => {
    it('should use fixture data', () => {
        const data = myFixture;
        // Use data in test
    });
});
```
