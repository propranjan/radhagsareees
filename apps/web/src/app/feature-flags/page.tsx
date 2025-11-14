/**
 * Feature Flag Demo Page
 * 
 * Showcases the feature flag system in action with interactive controls
 * and real examples of gated features.
 */

import React from 'react';
import { FeatureFlagDemo } from '../../components/feature-flags/FeatureFlagDemo';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function FeatureFlagsPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <FeatureFlagDemo />
    </div>
  );
}