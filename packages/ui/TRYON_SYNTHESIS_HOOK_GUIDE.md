# useTryOnSynthesis Hook - Usage Guide

## Overview

The `useTryOnSynthesis` hook provides a complete solution for managing virtual try-on image synthesis jobs. It handles image upload, job polling, status management, and error recovery with a clean, type-safe API.

## Basic Usage

```typescript
import { useTryOnSynthesis } from '@radhagsareees/ui';

function TryOnComponent() {
  const synthesis = useTryOnSynthesis({
    onComplete: (job) => {
      console.log('Processing completed!', job.previewUrl);
    },
    onError: (error) => {
      console.error('Processing failed:', error);
    }
  });

  const handleCapture = async (blob: Blob) => {
    try {
      await synthesis.uploadImage(blob, 'garment-123');
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div>
      {synthesis.job && (
        <div>
          Status: {synthesis.job.status}
          {synthesis.job.progress && <span> ({synthesis.job.progress}%)</span>}
        </div>
      )}
      
      {synthesis.isLoading && <button onClick={synthesis.cancelJob}>Cancel</button>}
      {synthesis.isError && <button onClick={synthesis.retry}>Retry</button>}
      {synthesis.isCompleted && synthesis.job?.previewUrl && (
        <img src={synthesis.job.previewUrl} alt="Processing result" />
      )}
    </div>
  );
}
```

## Hook Interface

### Return Values

```typescript
interface TryOnSynthesisHook {
  // State
  job: TryOnJob | null;          // Current job details
  isLoading: boolean;            // Upload/processing in progress
  isCompleted: boolean;          // Job completed successfully
  isError: boolean;              // Job failed or error occurred
  error: string | null;          // Error message if failed
  
  // Actions  
  uploadImage: (blob: Blob, garmentId: string, options?: TryOnProcessingOptions) => Promise<void>;
  cancelJob: () => Promise<void>;
  reset: () => void;
  retry: () => Promise<void>;
}
```

### Configuration Options

```typescript
interface TryOnSynthesisConfig {
  pollingInterval?: number;      // Default: 2000ms (2 seconds)
  maxPollingAttempts?: number;   // Default: 150 (5 minutes total)
  autoStartPolling?: boolean;    // Default: true
  
  // Callbacks
  onStatusChange?: (job: TryOnJob) => void;
  onComplete?: (job: TryOnJob) => void;
  onError?: (error: string, job?: TryOnJob) => void;
}
```

## Job Status Flow

```
pending → processing → completed
   ↓          ↓           ↑
cancelled  failed  ←─────┘
```

### Status Descriptions

- **`pending`**: Job queued for processing
- **`processing`**: AI model actively working
- **`completed`**: Successfully finished with `previewUrl`
- **`failed`**: Processing error with `error` message
- **`cancelled`**: Job was cancelled by user

## Processing Options

```typescript
interface TryOnProcessingOptions {
  quality?: number;                    // 0.1-1.0 (default: 0.8)
  format?: 'jpeg' | 'png' | 'webp';   // Output format (default: 'png')
  maxWidth?: number;                   // Max output width (default: 1024)
  maxHeight?: number;                  // Max output height (default: 1024)
  enableAdvancedWarping?: boolean;     // Enhanced mesh warping (default: false)
  priority?: 'low' | 'normal' | 'high'; // Processing priority (default: 'normal')
}
```

## Advanced Examples

### With Progress Tracking

```typescript
const synthesis = useTryOnSynthesis({
  onStatusChange: (job) => {
    if (job.progress) {
      updateProgressBar(job.progress);
    }
    
    if (job.estimatedTimeRemaining) {
      showETAMessage(`ETA: ${job.estimatedTimeRemaining}s`);
    }
  }
});
```

### With Error Recovery

```typescript
const synthesis = useTryOnSynthesis({
  onError: (error, job) => {
    // Log error for analytics
    analytics.track('synthesis_error', {
      jobId: job?.jobId,
      error: error,
      garmentId: currentGarment.id
    });
    
    // Show user-friendly error message
    if (error.includes('timeout')) {
      showNotification('Processing is taking longer than usual. Please try again.');
    } else if (error.includes('Invalid image')) {
      showNotification('Please capture a clearer image and try again.');
    }
  }
});
```

### Batch Processing

```typescript
const processBatch = async (images: Blob[], garmentId: string) => {
  const results = [];
  
  for (const image of images) {
    try {
      await synthesis.uploadImage(image, garmentId);
      
      // Wait for completion
      while (synthesis.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (synthesis.isCompleted) {
        results.push(synthesis.job?.previewUrl);
      }
      
      synthesis.reset(); // Reset for next image
      
    } catch (error) {
      console.error('Batch processing error:', error);
    }
  }
  
  return results;
};
```

### Real-time Status Updates

```typescript
function SynthesisStatusCard() {
  const synthesis = useTryOnSynthesis();
  
  if (!synthesis.job) {
    return (
      <div className="status-card">
        <p>No active processing job</p>
      </div>
    );
  }
  
  return (
    <div className="status-card">
      <div className="job-header">
        <span className="job-id">{synthesis.job.jobId}</span>
        <span className={`status ${synthesis.job.status}`}>
          {synthesis.job.status}
        </span>
      </div>
      
      {synthesis.job.progress !== undefined && (
        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${synthesis.job.progress}%` }}
            />
          </div>
          <span className="progress-text">{synthesis.job.progress}%</span>
        </div>
      )}
      
      {synthesis.job.estimatedTimeRemaining && (
        <div className="eta">
          ETA: {synthesis.job.estimatedTimeRemaining}s
        </div>
      )}
      
      <div className="actions">
        {synthesis.isLoading && (
          <button onClick={synthesis.cancelJob} className="cancel-btn">
            Cancel
          </button>
        )}
        
        {synthesis.isError && (
          <button onClick={synthesis.retry} className="retry-btn">
            Retry
          </button>
        )}
        
        {synthesis.isCompleted && synthesis.job.previewUrl && (
          <button 
            onClick={() => window.open(synthesis.job.previewUrl, '_blank')}
            className="view-result-btn"
          >
            View Result
          </button>
        )}
      </div>
    </div>
  );
}
```

## API Integration

The hook works with these API endpoints:

### POST `/api/tryon/upload`

**Request**: FormData
- `image`: File (captured image blob)
- `garmentId`: string (garment identifier)  
- `options`: string (JSON processing options)

**Response**: 
```json
{
  "success": true,
  "job": {
    "jobId": "job_1699564800000_abc123",
    "status": "pending",
    "progress": 0,
    "createdAt": "2023-11-09T12:00:00.000Z"
  }
}
```

### GET `/api/tryon/status/{jobId}`

**Response**:
```json
{
  "success": true,
  "job": {
    "jobId": "job_1699564800000_abc123",
    "status": "processing",
    "progress": 65,
    "estimatedTimeRemaining": 15,
    "createdAt": "2023-11-09T12:00:00.000Z"
  }
}
```

### POST `/api/tryon/cancel/{jobId}`

**Response**:
```json
{
  "success": true,
  "message": "Job cancelled successfully"
}
```

## Error Handling

### Common Error Scenarios

```typescript
// Network errors
synthesis.onError = (error) => {
  if (error.includes('fetch')) {
    showNetworkError();
  }
};

// File validation errors
try {
  await synthesis.uploadImage(blob, garmentId);
} catch (error) {
  if (error.code === 'INVALID_INPUT') {
    showValidationError(error.message);
  }
}

// Processing timeouts
synthesis.onError = (error) => {
  if (error.includes('timeout')) {
    showTimeoutMessage();
    // Optionally implement retry logic
  }
};
```

## Performance Considerations

### Optimization Tips

1. **Polling Interval**: Adjust based on expected processing time
   ```typescript
   const synthesis = useTryOnSynthesis({
     pollingInterval: 5000, // 5 seconds for longer jobs
   });
   ```

2. **Image Compression**: Reduce file size before upload
   ```typescript
   const compressedBlob = await compressImage(originalBlob, 0.8);
   await synthesis.uploadImage(compressedBlob, garmentId);
   ```

3. **Request Cancellation**: Always clean up on component unmount
   ```typescript
   useEffect(() => {
     return () => {
       synthesis.cancelJob();
     };
   }, []);
   ```

4. **Memory Management**: Reset state between jobs
   ```typescript
   const startNewJob = async (blob: Blob, garmentId: string) => {
     synthesis.reset(); // Clear previous job state
     await synthesis.uploadImage(blob, garmentId);
   };
   ```

## TypeScript Integration

### Full Type Safety

```typescript
import type { 
  TryOnJob, 
  TryOnJobStatus, 
  TryOnSynthesisError 
} from '@radhagsareees/ui';

const handleJobStatusChange = (job: TryOnJob) => {
  const status: TryOnJobStatus = job.status; // Fully typed
  
  switch (status) {
    case 'pending':
      showPendingState();
      break;
    case 'processing':
      showProgressBar(job.progress ?? 0);
      break;
    case 'completed':
      showResult(job.previewUrl!);
      break;
    case 'failed':
      showError(job.error ?? 'Unknown error');
      break;
    case 'cancelled':
      showCancelled();
      break;
  }
};
```

## Testing

### Mock Implementation for Tests

```typescript
// __mocks__/@radhagsareees/ui.ts
export const useTryOnSynthesis = jest.fn(() => ({
  job: null,
  isLoading: false,
  isCompleted: false,
  isError: false,
  error: null,
  uploadImage: jest.fn(),
  cancelJob: jest.fn(),
  reset: jest.fn(),
  retry: jest.fn(),
}));
```

### Test Example

```typescript
describe('TryOnSynthesis', () => {
  it('should handle successful upload', async () => {
    const mockSynthesis = {
      uploadImage: jest.fn().mockResolvedValue(undefined),
      job: { jobId: 'test-job', status: 'completed' },
      isCompleted: true
    };
    
    (useTryOnSynthesis as jest.Mock).mockReturnValue(mockSynthesis);
    
    const { result } = renderHook(() => useTryOnSynthesis());
    
    await act(async () => {
      await result.current.uploadImage(mockBlob, 'test-garment');
    });
    
    expect(result.current.isCompleted).toBe(true);
  });
});
```

This hook provides a robust, production-ready solution for managing virtual try-on synthesis jobs with comprehensive error handling, type safety, and performance optimization.