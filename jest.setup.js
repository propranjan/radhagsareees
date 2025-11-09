// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom')

// Polyfill TransformStream for Playwright compatibility
if (typeof global.TransformStream === 'undefined') {
  const { TransformStream } = require('node:stream/web');
  global.TransformStream = TransformStream;
}

// Setup jest-axe for accessibility testing
const { toHaveNoViolations } = require('jest-axe');
expect.extend(toHaveNoViolations);

// Only set up browser mocks in jsdom environment
if (typeof window !== 'undefined') {
  // Mock window.matchMedia for components that use media queries
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

if (typeof window !== 'undefined') {
  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))

  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))
}

if (typeof HTMLCanvasElement !== 'undefined') {
  // Mock canvas context for TryOnCanvas tests
  HTMLCanvasElement.prototype.getContext = jest.fn().mockImplementation(() => ({
    clearRect: jest.fn(),
    drawImage: jest.fn(),
    getImageData: jest.fn(() => ({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1
    })),
    putImageData: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    scale: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    setTransform: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
  }))
}

// Mock ImageData constructor for both environments
global.ImageData = global.ImageData || class ImageData {
  constructor(data, width, height) {
    if (arguments.length === 2) {
      // ImageData(width, height)
      this.width = data;
      this.height = width;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
    } else if (arguments.length === 3) {
      // ImageData(data, width, height)
      this.width = width;
      this.height = height;
      this.data = data;
    } else {
      throw new Error('Invalid arguments to ImageData constructor');
    }
  }
}

if (typeof navigator !== 'undefined') {
  // Mock getUserMedia for webcam tests
  Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    value: {
      getUserMedia: jest.fn().mockResolvedValue({
        getTracks: jest.fn(() => [
          {
            stop: jest.fn(),
            getSettings: jest.fn(() => ({ width: 640, height: 480 }))
          }
        ])
      }),
      enumerateDevices: jest.fn().mockResolvedValue([])
    }
  })
}

// Suppress console errors in tests unless explicitly testing them
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})