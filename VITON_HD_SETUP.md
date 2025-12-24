# VITON-HD Local Service Setup Guide

This guide explains how to set up and run the local VITON-HD service with your Next.js application.

## Overview

Instead of using Replicate's API, this setup runs the official VITON-HD model locally. This gives you:
- Full control over the model
- No API usage limits
- Privacy (images don't leave your infrastructure)
- Better integration with your saree images

## Prerequisites

- CUDA 11.8+ (for GPU support)
- Python 3.8+
- At least 8GB GPU VRAM (RTX 2080 or similar)
- Git

## Quick Start

### Option 1: Local Python Service (Recommended for Development)

1. **Clone VITON-HD repository**
   ```bash
   cd viton_service
   git clone https://github.com/shadow2496/VITON-HD.git
   cd ..
   ```

2. **Download pre-trained models**
   - Visit: https://drive.google.com/drive/folders/0B8kXrnobEVh9fnJHX3lCZzEtd20yUVAtTk5HdWk2OVV0RGl6YXc0NWhMOTlvb1FKX3Z1OUk
   - Download all `.pkl` files and test images
   - Extract to `viton_service/VITON-HD/checkpoints/` and `viton_service/VITON-HD/datasets/`

3. **Set up Python environment**
   ```bash
   cd viton_service
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```

4. **Start the service**
   ```bash
   python app.py
   ```

   The service will be available at `http://localhost:5000`

5. **Verify it's running**
   ```bash
   curl http://localhost:5000/health
   ```

6. **In another terminal, start the Next.js app**
   ```bash
   cd apps/web
   pnpm dev
   ```

### Option 2: Docker (Recommended for Production)

1. **Download checkpoints** (same as above)

2. **Build and run**
   ```bash
   docker-compose -f docker-compose-viton.yml up --build
   ```

   This will:
   - Build the VITON-HD service image
   - Start the service on port 5000
   - Start the web app on port 3000
   - Both services will be connected

## Configuration

Edit `viton_service/.env`:

```env
FLASK_PORT=5000
FLASK_DEBUG=False
VITON_HD_PATH=./VITON-HD
DEVICE=cuda  # or 'cpu' for CPU-only
```

Edit `apps/web/.env`:

```env
VITON_SERVICE_URL=http://localhost:5000
TRYON_MODEL_ENDPOINT=http://localhost:5000/api/tryon
TRYON_MODEL_TYPE=viton-hd
```

## API Endpoints

### Health Check
```bash
GET http://localhost:5000/health
```

Response:
```json
{
  "status": "healthy",
  "device": "cuda",
  "cuda_available": true,
  "model_loaded": true
}
```

### Generate Try-On
```bash
POST http://localhost:5000/api/tryon
Content-Type: multipart/form-data

person_image: <image file>
clothing_image: <image file>
person_mask: <mask file>
```

Response:
```json
{
  "success": true,
  "result_image": "data:image/png;base64,...",
  "message": "Try-on generated successfully"
}
```

## Troubleshooting

### Model checkpoint not found
- Make sure you downloaded all files from Google Drive
- Check the path: `viton_service/VITON-HD/checkpoints/gen.pkl`

### Out of memory (OOM) error
- Reduce image size (currently 1024x768)
- Use GPU with more VRAM
- Enable GPU memory optimization

### Service not responding
- Check if Flask service is running: `curl http://localhost:5000/health`
- Check Flask logs for errors
- Verify port 5000 is not blocked by firewall

### Slow inference
- First request loads the model (~2-3 seconds)
- Subsequent requests should be faster (3-5 seconds per image)
- GPU should show ~70-80% utilization

## Model Details

- **Model**: VITON-HD (from CVPR 2021)
- **Input**: 1024x768 RGB images
- **Output**: 1024x768 RGB image
- **Processing time**: 3-5 seconds per image
- **VRAM**: ~2-3GB

## References

- Official VITON-HD GitHub: https://github.com/shadow2496/VITON-HD
- Paper: https://arxiv.org/abs/2103.16874
- Pre-trained models: https://drive.google.com/drive/folders/0B8kXrnobEVh9fnJHX3lCZzEtd20yUVAtTk5HdWk2OVV0RGl6YXc0NWhMOTlvb1FKX3Z1OUk

## Architecture

```
Next.js App (Port 3000)
    ↓
POST /api/tryon/generate
    ↓
Node.js API Route
    ↓
Download images from Cloudinary
    ↓
Forward to VITON-HD Service
    ↓
Flask Service (Port 5000)
    ↓
VITON-HD Model (PyTorch)
    ↓
Return result as base64 PNG
    ↓
Upload to Cloudinary
    ↓
Return URL to frontend
```

## Next Steps

1. Download checkpoints from Google Drive
2. Follow "Quick Start - Option 1" or "Option 2"
3. Test the service with: `curl http://localhost:5000/health`
4. Test try-on in the web app
5. Verify output images are being saved to Cloudinary

