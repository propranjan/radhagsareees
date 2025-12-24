# Docker Deployment - Quick Start (Windows)

## Prerequisites

1. **Docker Desktop for Windows**
   - Download: https://www.docker.com/products/docker-desktop
   - System requirements: Windows 10/11 Pro, Enterprise, or Education with WSL 2
   - Install and start Docker Desktop

2. **Verify Installation**
   ```bash
   docker --version
   docker-compose --version
   ```

3. **Enable GPU (Optional but Recommended)**
   - NVIDIA GPU (RTX 2060 or better)
   - NVIDIA drivers: https://www.nvidia.com/Download/driverDetails.aspx
   - After installation, verify:
     ```bash
     docker run --rm --runtime=nvidia nvidia/cuda:11.8.0-runtime-ubuntu22.04 nvidia-smi
     ```

## Step 1: Download Model Checkpoints

1. Visit: https://drive.google.com/drive/folders/0B8kXrnobEVh9fnJHX3lCZzEtd20yUVAtTk5HdWk2OVV0RGl6YXc0NWhMOTlvb1FKX3Z1OUk

2. Download all `.pkl` files (about 500MB total):
   - `gen.pkl` (required)
   - Other model files
   - Test images (optional, for reference)

3. Create folder structure:
   ```powershell
   mkdir -p viton_service\VITON-HD\checkpoints
   ```

4. Extract downloaded `.zip` files to `viton_service\VITON-HD\checkpoints\`

   Your folder should look like:
   ```
   radhagsareees\
   └── viton_service\
       └── VITON-HD\
           └── checkpoints\
               ├── gen.pkl
               ├── dataset_loader.py
               └── ... (other files)
   ```

## Step 2: Build Docker Images

Open PowerShell and run:

```powershell
cd c:\Users\2025\PRIYARANJAN\Personal-Project\radhagsareees

# Build images (takes 10-15 minutes first time)
.\deploy.bat build

# Or manual command:
docker-compose -f docker-compose-viton.yml build
```

This downloads and installs:
- CUDA 11.8 runtime
- Python 3.10
- PyTorch and dependencies
- Flask and requirements

**Expected output**: `Successfully tagged radhagsareees-viton-hd-service:latest`

## Step 3: Start Services

```powershell
# Option A: Start in background (recommended)
.\deploy.bat up-d

# Option B: Start in foreground (see all logs)
.\deploy.bat up

# View status
.\deploy.bat ps
```

**First startup takes 30-60 seconds** while the model loads into GPU memory.

Expected output:
```
NAME                  IMAGE               STATUS              PORTS
viton-hd-service      ...                 Up (healthy)        5000/tcp
web                   ...                 Up                  3000:3000
```

## Step 4: Test Services

```powershell
# Check VITON-HD health
.\deploy.bat health

# View logs
.\deploy.bat logs

# View just VITON-HD service logs
.\deploy.bat viton-logs

# View just Web app logs
.\deploy.bat web-logs
```

Expected response from health check:
```json
{
  "status": "healthy",
  "device": "cuda",
  "cuda_available": true,
  "model_loaded": true
}
```

## Step 5: Access Applications

- **Web App**: http://localhost:3000
- **VITON-HD Service**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## Step 6: Test Virtual Try-On

1. Open http://localhost:3000 in browser
2. Navigate to any product with try-on feature
3. Click "Try Camera" or upload image
4. Wait 3-5 seconds for inference
5. See result

## Common Commands

```powershell
# View all running containers
.\deploy.bat ps

# Stop services (keep data)
.\deploy.bat stop

# Restart services
.\deploy.bat restart

# Stop and clean up everything
.\deploy.bat clean

# View resource usage
.\deploy.bat stats

# View service logs
.\deploy.bat logs

# View VITON-HD service logs specifically
.\deploy.bat viton-logs

# Get shell access to VITON-HD container
.\deploy.bat shell
```

## Troubleshooting

### Services won't start

**Check Docker Desktop is running**
- Click Windows Start Menu
- Look for "Docker Desktop" and launch it
- Wait for it to fully start (see Docker icon in taskbar)

**Clean up Docker**
```powershell
docker system prune -a
docker volume prune
```

### VITON-HD shows "unhealthy"

Check logs:
```powershell
.\deploy.bat viton-logs
```

**"Model checkpoint not found"**
- Verify `viton_service/VITON-HD/checkpoints/gen.pkl` exists
- Re-download from Google Drive if missing

**"Out of memory"**
- Check GPU has at least 4GB VRAM
- Close other GPU applications
- Reduce batch size in code (advanced)

### Can't access http://localhost:3000

```powershell
# Check if services are running
.\deploy.bat ps

# Check if ports are listening
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Restart services
.\deploy.bat restart
```

### GPU not detected

Verify NVIDIA Docker runtime:
```powershell
docker run --rm --runtime=nvidia nvidia/cuda:11.8.0-runtime-ubuntu22.04 nvidia-smi
```

If this fails:
1. Update NVIDIA drivers
2. Install NVIDIA Container Runtime: https://github.com/NVIDIA/nvidia-docker
3. Restart Docker Desktop

### Slow inference (>10 seconds)

Check if using CPU instead of GPU:
```powershell
.\deploy.bat health
```

If `"cuda_available": false`, GPU is not detected. Try:
```powershell
# Restart Docker Desktop
# Update NVIDIA drivers
# Verify NVIDIA Container Runtime is installed
```

## Performance

Expected performance:
- **First request**: 30-60 seconds (model loading + inference)
- **Subsequent requests**: 3-5 seconds per image
- **GPU utilization**: 70-90%
- **Memory usage**: 2-3GB VRAM

## Stopping Services

```powershell
# Stop but keep data
.\deploy.bat stop

# Stop and remove everything (clean start next time)
.\deploy.bat clean
```

## Next Steps

1. ✅ Download model checkpoints
2. ✅ Run `.\deploy.bat build`
3. ✅ Run `.\deploy.bat up-d`
4. ✅ Verify health with `.\deploy.bat health`
5. ✅ Test at http://localhost:3000

## Support

For issues:
1. Check logs: `.\deploy.bat logs`
2. Check VITON-HD specifically: `.\deploy.bat viton-logs`
3. Verify checkpoints downloaded
4. Ensure Docker Desktop is running
5. Check disk space: `docker system df`

**Still stuck?** See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for detailed troubleshooting.

