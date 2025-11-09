/**
 * Try-On Job Status API
 * 
 * Handles polling requests for job status updates.
 * Returns current job state including progress and results.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withEnvValidation } from '@/lib/env-validation';
import type { 
  TryOnJob, 
  TryOnJobStatusResponse 
} from '@radhagsareees/ui/types/tryon';

// TODO: Replace with actual database
// This should match the jobs Map from upload route
declare global {
  var tryonJobs: Map<string, TryOnJob> | undefined;
}

// Use global variable to simulate persistence across requests
const jobs = globalThis.tryonJobs ?? (globalThis.tryonJobs = new Map());

export const GET = withEnvValidation(async function(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    
    if (!jobId?.trim()) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Job ID is required' 
        },
        { status: 400 }
      );
    }
    
    // Retrieve job from storage
    const job = jobs.get(jobId);
    
    if (!job) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Job not found' 
        },
        { status: 404 }
      );
    }
    
    // Return current job status
    const response: TryOnJobStatusResponse = {
      success: true,
      job,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Job status check error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check job status' 
      },
      { status: 500 }
    );
  }
});

/**
 * TODO: Database Integration
 * 
 * Replace in-memory storage with proper database:
 * 
 * ```typescript
 * import { prisma } from '@/lib/prisma';
 * 
 * const job = await prisma.tryonJob.findUnique({
 *   where: { id: jobId },
 *   include: {
 *     user: true,
 *     garment: true,
 *   },
 * });
 * ```
 */