# Feature Flag System Documentation

## Overview

The Radha Gsareees feature flag system provides a lightweight, cookie-backed mechanism for controlling feature rollouts and A/B testing. It supports both server-side and client-side evaluation with SSR safety.

## Architecture

### Core Components

1. **Server-Side Utilities** (`src/lib/feature-flags.ts`)
   - Environment variable parsing
   - Cookie override support (development only)
   - Server-side flag evaluation
   - SSR context creation

2. **Client-Side Components** (`src/components/feature-flags/`)
   - React context provider
   - Feature gate components
   - Cookie management utilities
   - Development helpers

3. **Feature Flag Definitions**
   - `tryon_v2`: Enhanced server-side try-on experience
   - `reviews_moderation_strict`: Strict review moderation

## Usage Patterns

### Server-Side Flag Evaluation

```typescript
import { getServerFeatureFlag } from '@/lib/feature-flags';

// In server components or API routes
export default async function MyComponent() {
  const isTryOnV2Enabled = await getServerFeatureFlag('tryon_v2');
  
  if (isTryOnV2Enabled) {
    return <EnhancedTryOnButton />;
  }
  
  return <StandardTryOnButton />;
}
```

### Client-Side Feature Gating

```tsx
import { FeatureGate, useFeatureFlag } from '@/components/feature-flags/FeatureFlagProvider';

// Using FeatureGate component
function MyComponent() {
  return (
    <FeatureGate 
      flag="tryon_v2"
      fallback={<StandardFeature />}
    >
      <EnhancedFeature />
    </FeatureGate>
  );
}

// Using hook
function MyOtherComponent() {
  const isTryOnV2Enabled = useFeatureFlag('tryon_v2');
  
  return (
    <div>
      {isTryOnV2Enabled ? (
        <EnhancedUI />
      ) : (
        <StandardUI />
      )}
    </div>
  );
}
```

### Multi-Flag Logic

```tsx
import { MultiFeatureGate, useFeatureFlagsBatch } from '@/components/feature-flags/FeatureFlagProvider';

// Require multiple flags
function AdvancedComponent() {
  return (
    <MultiFeatureGate 
      flags={['tryon_v2', 'reviews_moderation_strict']}
      mode="all" // or "any"
      fallback={<BasicComponent />}
    >
      <AdvancedFeature />
    </MultiFeatureGate>
  );
}

// Check multiple flags in code
function SmartComponent() {
  const flags = useFeatureFlagsBatch(['tryon_v2', 'reviews_moderation_strict']);
  
  const showAdvancedUI = flags.tryon_v2 && flags.reviews_moderation_strict;
  
  return (
    <div>
      {showAdvancedUI ? <AdvancedUI /> : <StandardUI />}
    </div>
  );
}
```

## Configuration

### Environment Variables

Set these in your `.env.local` file:

```bash
# Try-On V2 Features (default: false)
FEATURE_TRYON_V2=true

# Review Moderation (default: true)  
FEATURE_REVIEWS_MODERATION_STRICT=false
```

### Development Cookie Overrides

In development, you can override flags using browser cookies:

```javascript
// In browser console
FeatureFlags.setCookieOverride('tryon_v2', true);
FeatureFlags.logCurrentState();
FeatureFlags.clearAllCookieOverrides();
```

Or use the demo page at `/feature-flags` for interactive testing.

## Implementation Examples

### 1. Try-On Button Enhancement

The try-on button demonstrates server-side and client-side gating:

```tsx
// Server Component (apps/web/src/components/feature-flags/TryOnButton.tsx)
export async function EnhancedServerTryOnButton() {
  const isTryOnV2Enabled = await getServerFeatureFlag('tryon_v2');
  
  if (!isTryOnV2Enabled) {
    return null; // Standard button would be rendered instead
  }

  return (
    <button className="enhanced-tryon-button">
      <Lightning /> Try On Virtually (Enhanced) <Badge>V2</Badge>
    </button>
  );
}

// Client Component usage
function ProductPage() {
  return (
    <FeatureGate flag="tryon_v2" fallback={<StandardTryOnButton />}>
      <EnhancedTryOnButton />
    </FeatureGate>
  );
}
```

### 2. Review Moderation Logic

```tsx
function ReviewSubmission({ review }) {
  const strictModeration = useFeatureFlag('reviews_moderation_strict');
  
  const handleSubmit = async () => {
    const endpoint = strictModeration 
      ? '/api/reviews/submit-for-approval'
      : '/api/reviews/submit-direct';
      
    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(review),
    });
    
    if (strictModeration) {
      showMessage('Review submitted for approval');
    } else {
      showMessage('Review published successfully');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Review form */}
      {strictModeration && (
        <Notice>Reviews require approval before publishing</Notice>
      )}
    </form>
  );
}
```

## Best Practices

### 1. SSR Safety

Always provide fallbacks to prevent hydration mismatches:

```tsx
// ✅ Good
<FeatureGate flag="new_feature" fallback={<OldComponent />}>
  <NewComponent />
</FeatureGate>

// ❌ Bad (can cause hydration issues)
{useFeatureFlag('new_feature') && <NewComponent />}
```

### 2. Gradual Rollouts

Use environment variables for gradual rollouts:

```bash
# Development
FEATURE_TRYON_V2=true

# Staging  
FEATURE_TRYON_V2=true

# Production (gradual rollout)
FEATURE_TRYON_V2=false  # Initially off, then enable
```

### 3. Cleanup Strategy

Document when flags should be removed:

```typescript
export type FeatureFlag = 
  | 'tryon_v2'              // TODO: Remove after Q2 2024 rollout
  | 'reviews_moderation_strict';  // Permanent flag
```

### 4. Testing

Test both states of your flags:

```tsx
// In tests
describe('TryOn Button', () => {
  it('shows standard button when v2 is disabled', () => {
    render(<TryOnButton />, {
      featureFlags: { tryon_v2: false }
    });
    
    expect(screen.getByText('Try On Virtually')).toBeInTheDocument();
    expect(screen.queryByText('Enhanced')).not.toBeInTheDocument();
  });

  it('shows enhanced button when v2 is enabled', () => {
    render(<TryOnButton />, {
      featureFlags: { tryon_v2: true }
    });
    
    expect(screen.getByText('Try On Virtually (Enhanced)')).toBeInTheDocument();
  });
});
```

## Development Workflow

### 1. Adding New Flags

1. Add to `FeatureFlag` type in `src/lib/feature-flags.ts`
2. Add configuration in `FEATURE_FLAGS` object
3. Add environment variable documentation
4. Implement feature gating in components
5. Add tests for both states

### 2. Development Testing

1. Visit `/feature-flags` demo page
2. Toggle flags using UI controls
3. Observe behavior changes in real-time
4. Use browser console for programmatic control

### 3. Production Deployment

1. Set environment variables in deployment config
2. Deploy with flags initially disabled
3. Gradually enable for user segments
4. Monitor metrics and error rates
5. Full rollout when stable

## Monitoring and Analytics

### Flag Usage Tracking

```typescript
// Track flag exposure for analytics
function trackFeatureFlagExposure(flag: FeatureFlag, enabled: boolean) {
  analytics.track('feature_flag_exposed', {
    flag_name: flag,
    flag_enabled: enabled,
    user_id: getCurrentUserId(),
    timestamp: Date.now(),
  });
}

// Use in components
function MyComponent() {
  const isFlagEnabled = useFeatureFlag('tryon_v2');
  
  useEffect(() => {
    trackFeatureFlagExposure('tryon_v2', isFlagEnabled);
  }, [isFlagEnabled]);
  
  return <div>{/* Component content */}</div>;
}
```

### Performance Impact

Feature flags add minimal overhead:
- Server-side evaluation: ~1ms per flag
- Client-side evaluation: ~0.1ms per flag  
- Cookie parsing: ~2ms total (cached)

## Troubleshooting

### Common Issues

1. **Hydration Mismatches**
   - Always use `FeatureGate` with fallbacks
   - Ensure server and client contexts match

2. **Cookie Overrides Not Working**
   - Check development mode is enabled
   - Verify cookie domain and path settings
   - Clear browser cache and cookies

3. **Environment Variables Not Loading**
   - Restart development server after adding new variables
   - Check `.env.local` file syntax
   - Verify variable naming matches `FEATURE_*` pattern

### Debug Commands

```javascript
// In browser console (development only)
FeatureFlags.logCurrentState();           // Show all flag states
FeatureFlags.getCurrentCookieOverrides(); // Show active overrides
FeatureFlags.clearAllCookieOverrides();   // Reset to defaults
```

## Future Enhancements

### Planned Features

1. **User Segmentation**: Target flags to specific user groups
2. **A/B Testing**: Built-in experiment management
3. **Remote Configuration**: Update flags without deployment
4. **Analytics Dashboard**: Real-time flag usage metrics
5. **Rollback Safety**: Automatic flag disabling on errors

### Integration Points

- **Analytics**: Track flag exposure and conversion rates
- **Error Monitoring**: Correlate errors with flag states  
- **Performance Monitoring**: Measure feature impact
- **CI/CD**: Automated flag management in pipelines