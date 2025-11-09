# TryOnCanvas Component

## Overview

The `TryOnCanvas` is an advanced, interactive virtual try-on component that provides real-time garment overlay capabilities using modern web technologies including TensorFlow.js and BodyPix for AI-powered person segmentation.

## Features

- **Real-time Webcam Integration**: Seamless camera access with permission handling
- **AI-Powered Person Segmentation**: Uses TensorFlow.js BodyPix for accurate person detection
- **Interactive Garment Overlay**: Position, scale, rotate, and adjust opacity in real-time
- **Lightweight Mesh Warping**: 3x3 grid system for natural garment fitting
- **Accessibility Support**: Full keyboard navigation and ARIA labels
- **High-Quality Capture**: Export try-on images as high-quality JPEGs
- **Responsive Design**: Adaptive UI that works on various screen sizes

## Installation

```bash
# Install the UI package
npm install @radhagsareees/ui

# Or using pnpm
pnpm add @radhagsareees/ui
```

## Basic Usage

```tsx
import { TryOnCanvas } from '@radhagsareees/ui';

function MyTryOnPage() {
  const handleModelReady = (modelInfo) => {
    console.log('AI model loaded:', modelInfo);
  };

  const handleCapture = (blob, dataUrl) => {
    // Upload to your server or save locally
    console.log('Captured image:', dataUrl);
  };

  return (
    <TryOnCanvas
      garmentImageUrl="/path/to/saree-image.jpg"
      onReady={handleModelReady}
      onCapture={handleCapture}
      width={640}
      height={480}
    />
  );
}
```

## Advanced Usage

```tsx
import { TryOnCanvas, GarmentTransform } from '@radhagsareees/ui';
import { useState } from 'react';

function AdvancedTryOn() {
  const [poseDetected, setPoseDetected] = useState(false);
  const [modelStatus, setModelStatus] = useState('loading');

  const initialTransform: Partial<GarmentTransform> = {
    x: 10,
    y: -20,
    scale: 1.2,
    opacity: 0.9
  };

  return (
    <div className="try-on-container">
      <TryOnCanvas
        garmentImageUrl="/elegant-silk-saree.jpg"
        initialTransform={initialTransform}
        debug={process.env.NODE_ENV === 'development'}
        onReady={(modelInfo) => {
          setModelStatus('ready');
          console.log('Model loaded:', modelInfo.name, modelInfo.version);
        }}
        onPoseState={(poseOk) => {
          setPoseDetected(poseOk);
        }}
        onCapture={(blob, dataUrl) => {
          // Upload to your API
          uploadTryOnImage(blob);
        }}
        width={800}
        height={600}
        className="mx-auto rounded-xl shadow-2xl"
      />
      
      <div className="status-panel">
        <p>Model: {modelStatus}</p>
        <p>Pose: {poseDetected ? 'Detected' : 'Not detected'}</p>
      </div>
    </div>
  );
}
```

## Props API

### TryOnCanvasProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `garmentImageUrl` | `string` | ✅ | - | URL of the garment image to overlay |
| `onReady` | `(modelInfo: ModelInfo) => void` | ❌ | - | Callback when AI model is loaded |
| `onPoseState` | `(poseOk: boolean) => void` | ❌ | - | Callback for pose detection state |
| `onCapture` | `(blob: Blob, dataUrl: string) => void` | ❌ | - | Callback when image is captured |
| `initialTransform` | `Partial<GarmentTransform>` | ❌ | `{}` | Initial garment positioning |
| `width` | `number` | ❌ | `640` | Canvas width in pixels |
| `height` | `number` | ❌ | `480` | Canvas height in pixels |
| `debug` | `boolean` | ❌ | `false` | Show segmentation overlay for debugging |
| `className` | `string` | ❌ | `''` | Additional CSS classes |

### GarmentTransform

```typescript
interface GarmentTransform {
  x: number;        // X position offset in pixels
  y: number;        // Y position offset in pixels
  scale: number;    // Scale factor (1.0 = original size)
  rotation: number; // Rotation angle in degrees
  opacity: number;  // Opacity (0.0 to 1.0)
}
```

### ModelInfo

```typescript
interface ModelInfo {
  name: string;                    // Model name (e.g., "BodyPix MobileNetV1")
  version: string;                 // Model version
  inputSize: [number, number];     // Input dimensions [width, height]
  outputStride: number;            // Model output stride
}
```

## Interactive Controls

### Mouse/Touch Controls
- **Position Sliders**: Adjust X/Y position with range inputs
- **Scale Slider**: Resize garment from 0.1x to 3x
- **Rotation Slider**: Rotate 0-360 degrees
- **Opacity Slider**: Adjust transparency 0-100%
- **Capture Button**: Take high-quality screenshot
- **Reset Button**: Return to default positioning

### Keyboard Controls
- **Arrow Keys**: Move garment (hold Shift for faster movement)
- **+/-**: Scale up/down (hold Shift for larger steps)
- **R**: Rotate clockwise (hold Shift for 15° steps)
- **Space**: Capture image
- **Escape**: Hide/show controls

## Error Handling

The component handles various error states gracefully:

```tsx
<TryOnCanvas
  garmentImageUrl="/saree.jpg"
  onReady={(modelInfo) => {
    // Model loaded successfully
  }}
  onPoseState={(poseOk) => {
    if (!poseOk) {
      showMessage("Please position yourself in the camera frame");
    }
  }}
/>
```

Common error scenarios:
- **Camera permission denied**: Shows retry button
- **Model loading failure**: Displays error message with reload option
- **Invalid garment image**: Falls back to placeholder
- **Performance issues**: Automatically adjusts processing quality

## Performance Optimization

### Model Configuration
```javascript
// Lightweight configuration for mobile devices
const mobileConfig = {
  architecture: 'MobileNetV1',
  outputStride: 16,
  multiplier: 0.50,  // Reduced for better performance
  quantBytes: 2
};

// High-quality configuration for desktop
const desktopConfig = {
  architecture: 'MobileNetV1',
  outputStride: 16,
  multiplier: 0.75,
  quantBytes: 4
};
```

### Memory Management
The component automatically:
- Cancels animation frames on unmount
- Cleans up WebRTC streams
- Disposes of TensorFlow.js tensors
- Optimizes canvas rendering

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WebRTC | ✅ 54+ | ✅ 36+ | ✅ 11+ | ✅ 79+ |
| Canvas API | ✅ All | ✅ All | ✅ All | ✅ All |
| TensorFlow.js | ✅ 58+ | ✅ 57+ | ✅ 11+ | ✅ 79+ |
| WebAssembly | ✅ 57+ | ✅ 52+ | ✅ 11+ | ✅ 79+ |

## Security Considerations

### Privacy
- **Local Processing**: All AI processing happens in the browser
- **No Data Upload**: Webcam feed never leaves the user's device
- **Optional Capture**: Image capture only occurs on user action

### Permissions
```typescript
// Check camera permissions before initializing
const checkPermissions = async () => {
  try {
    const result = await navigator.permissions.query({ name: 'camera' });
    return result.state; // 'granted', 'denied', or 'prompt'
  } catch (error) {
    return 'unknown';
  }
};
```

## Integration Examples

### E-commerce Product Page
```tsx
function ProductPage({ product }) {
  return (
    <div className="product-layout">
      <div className="product-images">
        <TryOnCanvas
          garmentImageUrl={product.images[0]}
          onCapture={(blob, dataUrl) => {
            // Add to shopping cart with preview
            addToCart(product.id, { tryOnImage: dataUrl });
          }}
        />
      </div>
      <div className="product-details">
        {/* Product info */}
      </div>
    </div>
  );
}
```

### Social Sharing Integration
```tsx
function SocialTryOn({ product }) {
  const handleCapture = async (blob, dataUrl) => {
    // Upload to temporary storage
    const uploadUrl = await uploadTryOnImage(blob);
    
    // Share on social media
    if (navigator.share) {
      await navigator.share({
        title: `Check out this ${product.name}!`,
        text: 'Virtual try-on with AI',
        url: uploadUrl
      });
    }
  };

  return (
    <TryOnCanvas
      garmentImageUrl={product.image}
      onCapture={handleCapture}
    />
  );
}
```

### Analytics Integration
```tsx
function AnalyticsTryOn({ product }) {
  return (
    <TryOnCanvas
      garmentImageUrl={product.image}
      onReady={(modelInfo) => {
        analytics.track('tryon_model_loaded', {
          product_id: product.id,
          model: modelInfo.name
        });
      }}
      onCapture={(blob) => {
        analytics.track('tryon_image_captured', {
          product_id: product.id,
          image_size: blob.size
        });
      }}
    />
  );
}
```

## Troubleshooting

### Common Issues

**1. Model fails to load**
```
Error: Failed to load TensorFlow.js
```
- Check internet connection
- Verify CDN accessibility
- Try refreshing the page

**2. Camera access denied**
```
Error: Webcam access denied
```
- Check browser permissions
- Ensure HTTPS connection
- Try different browser

**3. Performance issues**
```
Warning: Low frame rate detected
```
- Reduce canvas dimensions
- Lower model quality settings
- Close other browser tabs

**4. Garment positioning issues**
```
Garment not aligning properly
```
- Adjust initial transform values
- Ensure good lighting
- Position yourself properly in frame

### Debug Mode

Enable debug mode to visualize segmentation:

```tsx
<TryOnCanvas
  garmentImageUrl="/saree.jpg"
  debug={true} // Shows person segmentation overlay
/>
```

## Contributing

To contribute to the TryOnCanvas component:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit a pull request

## License

This component is part of the Radha G Sarees monorepo and is proprietary software. See the main repository license for details.

## Support

For technical support or feature requests:
- Create an issue in the main repository
- Contact the development team
- Check the documentation wiki

---

*Built with ❤️ by the Radha G Sarees development team*