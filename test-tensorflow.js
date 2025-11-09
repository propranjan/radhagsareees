// test-tensorflow.js
try {
  const tf = require('@tensorflow/tfjs');
  console.log('✅ TensorFlow.js loaded successfully!');
  console.log('Version:', tf.version);
  console.log('Backend:', tf.getBackend());
} catch (error) {
  console.error('❌ Failed to load TensorFlow.js:', error.message);
}
