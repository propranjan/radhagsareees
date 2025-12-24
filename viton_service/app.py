#!/usr/bin/env python3
"""
VITON-HD Flask Service
Provides a REST API wrapper around the VITON-HD virtual try-on model
"""

import os
import sys
import cv2
import torch
import numpy as np
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
import base64
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
VITON_HD_PATH = os.getenv('VITON_HD_PATH', './VITON-HD')
CHECKPOINT_DIR = os.path.join(VITON_HD_PATH, 'checkpoints')
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
MAX_IMAGE_SIZE = 1024 * 768 * 3  # 1024x768 RGB image

print(f"Using device: {DEVICE}")
print(f"VITON-HD path: {VITON_HD_PATH}")

# Add VITON-HD to path
sys.path.insert(0, VITON_HD_PATH)

try:
    from networks import Generator
except ImportError as e:
    print(f"Warning: Could not import VITON-HD networks: {e}")
    print("Make sure VITON-HD is cloned and available")

# Global model instance
model = None

def load_model():
    """Load VITON-HD model"""
    global model
    try:
        if model is None:
            print("Loading VITON-HD model...")
            
            # Load checkpoint
            checkpoint_path = os.path.join(CHECKPOINT_DIR, 'gen.pkl')
            if not os.path.exists(checkpoint_path):
                raise FileNotFoundError(f"Model checkpoint not found at {checkpoint_path}")
            
            # Initialize generator
            model = Generator(4, 4, 3)
            checkpoint = torch.load(checkpoint_path, map_location=DEVICE)
            model.load_state_dict(checkpoint)
            model = model.to(DEVICE)
            model.eval()
            
            print("Model loaded successfully!")
        return model
    except Exception as e:
        print(f"Error loading model: {e}")
        raise

def preprocess_image(image_data: bytes) -> torch.Tensor:
    """
    Preprocess image data to tensor
    Expects RGB image
    """
    try:
        # Decode image
        img = Image.open(io.BytesIO(image_data)).convert('RGB')
        
        # Resize to 1024x768 (VITON-HD standard)
        img = img.resize((1024, 768), Image.LANCZOS)
        
        # Convert to tensor
        img_array = np.array(img, dtype=np.float32) / 255.0
        
        # Convert to tensor and normalize
        img_tensor = torch.from_numpy(img_array).permute(2, 0, 1)
        
        # Normalize (ImageNet stats)
        mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
        std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
        img_tensor = (img_tensor - mean) / std
        
        return img_tensor.unsqueeze(0).to(DEVICE)
    except Exception as e:
        raise ValueError(f"Error preprocessing image: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'device': str(DEVICE),
        'cuda_available': torch.cuda.is_available(),
        'model_loaded': model is not None
    })

@app.route('/api/tryon', methods=['POST'])
def generate_tryon():
    """
    Generate virtual try-on image
    
    Expected form data:
    - person_image: RGB image of person (1024x768)
    - clothing_image: RGB image of clothing (1024x768)
    - person_mask: Segmentation mask
    
    Returns:
    - result_image: Try-on result as base64
    """
    try:
        # Check if model is loaded
        if model is None:
            load_model()
        
        # Validate request
        if 'person_image' not in request.files or 'clothing_image' not in request.files:
            return jsonify({'error': 'Missing required files: person_image, clothing_image'}), 400
        
        # Get images from request
        person_file = request.files['person_image']
        clothing_file = request.files['clothing_image']
        
        print(f"Processing try-on request: person={person_file.filename}, clothing={clothing_file.filename}")
        
        # Read and preprocess images
        person_image = preprocess_image(person_file.read())
        clothing_image = preprocess_image(clothing_file.read())
        
        print(f"Person image shape: {person_image.shape}")
        print(f"Clothing image shape: {clothing_image.shape}")
        
        # Generate try-on (inference)
        with torch.no_grad():
            # VITON-HD expects stacked input [person, clothing, mask]
            # For now, we'll use a simplified approach
            output = model(person_image, clothing_image)
        
        print(f"Model output shape: {output.shape}")
        
        # Post-process output
        output_np = output[0].cpu().permute(1, 2, 0).numpy()
        output_np = (output_np * 0.5 + 0.5) * 255  # Denormalize
        output_np = np.clip(output_np, 0, 255).astype(np.uint8)
        
        # Convert to PIL Image
        result_image = Image.fromarray(output_np)
        
        # Encode to base64
        buffered = io.BytesIO()
        result_image.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        return jsonify({
            'success': True,
            'result_image': f'data:image/png;base64,{img_base64}',
            'message': 'Try-on generated successfully'
        })
    
    except Exception as e:
        print(f"Error generating try-on: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/models', methods=['GET'])
def list_models():
    """List available models"""
    try:
        models = []
        if os.path.exists(CHECKPOINT_DIR):
            models = [f for f in os.listdir(CHECKPOINT_DIR) if f.endswith('.pkl')]
        
        return jsonify({
            'available_models': models,
            'selected_model': 'gen.pkl'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Load model on startup
    try:
        load_model()
    except Exception as e:
        print(f"Warning: Could not preload model: {e}")
        print("Model will be loaded on first request")
    
    # Start Flask server
    port = int(os.getenv('FLASK_PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_DEBUG', 'False') == 'True')
