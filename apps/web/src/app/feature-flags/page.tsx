/**
 * Feature Flag Demo Page
 * 
 * Showcases the feature flag system in action with interactive controls
 * and real examples of gated features.
 */

import React from 'react';
import { FeatureFlagDemo } from '../../components/feature-flags/FeatureFlagDemo';

export default function FeatureFlagsPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <FeatureFlagDemo />
    </div>
  );
}