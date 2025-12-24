# Docker Deployment Guide - VITON-HD + Next.js Application

## Prerequisites

- **Docker**: https://www.docker.com/products/docker-desktop
- **Docker Compose**: Included with Docker Desktop
- **GPU Support** (Optional but recommended):
  - NVIDIA GPU
  - NVIDIA Container Runtime: https://github.com/NVIDIA/nvidia-docker

### Verify Installation

```bash
docker --version
docker-compose --version
```

## Step 1: Download VITON-HD Checkpoints

1. Visit: https://drive.google.com/drive/folders/0B8kXrnobEVh9fnJHX3lCZzEtd20yUVAtTk5HdWk2OVV0RGl6YXc0NWhMOTlvb1FKX3Z1OUk

2. Download:
   - `gen.pkl` (Generator model)
   - All other `.pkl` files
   - Test image pairs (for reference)

3. Create checkpoint directory:
   ```bash
   mkdir -p viton_service/VITON-HD/checkpoints
   ```

4. Extract downloaded files to `viton_service/VITON-HD/checkpoints/`

Your structure should look like:
```
viton_service/
├── VITON-HD/
│   ├── checkpoints/
│   │   ├── gen.pkl
│   │   └── ... (other model files)
│   └── ...
├── app.py
├── requirements.txt
├── Dockerfile
└── .env
```

## Step 2: Configure Environment

Update your `.env` files:

**apps/web/.env**
```env
VITON_SERVICE_URL=http://viton-hd-service:5000
TRYON_MODEL_ENDPOINT=http://viton-hd-service:5000/api/tryon
TRYON_MODEL_TYPE=viton-hd
# ... other env vars
```

**viton_service/.env**
```env
FLASK_PORT=5000
FLASK_DEBUG=False
VITON_HD_PATH=/app/VITON-HD
DEVICE=cuda
```

## Step 3: Build Docker Images

```bash
# Build all services
docker-compose -f docker-compose-viton.yml build

# Or build specific service
docker-compose -f docker-compose-viton.yml build viton-hd-service
```

This will:
- Download CUDA 11.8 base image (~2.5GB)
- Install Python and dependencies (~500MB)
- Install PyTorch and torch dependencies (~2GB)
- Total size: ~5-6GB per image

## Step 4: Start Services

```bash
# Start in foreground (see logs)
docker-compose -f docker-compose-viton.yml up

# Or start in background
docker-compose -f docker-compose-viton.yml up -d

# View logs
docker-compose -f docker-compose-viton.yml logs -f

# View specific service logs
docker-compose -f docker-compose-viton.yml logs -f viton-hd-service
```

## Step 5: Verify Services

### Check service status
```bash
docker-compose -f docker-compose-viton.yml ps
```

Expected output:
```
NAME                  STATUS
viton-hd-service      Up (healthy)
web                   Up
```

### Test VITON-HD service
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "device": "cuda",
  "cuda_available": true,
  "model_loaded": true
}
```

### Access web application
```
http://localhost:3000
```

## Step 6: Use the Application

1. Navigate to a product page with try-on capability
2. Click "Try Camera" or upload an image
3. The request will be routed to the local VITON-HD service
4. Result will be saved to Cloudinary
5. Try-on image will be displayed

## Common Commands

```bash
# Stop services
docker-compose -f docker-compose-viton.yml down

# Stop and remove volumes
docker-compose -f docker-compose-viton.yml down -v

# Restart services
docker-compose -f docker-compose-viton.yml restart

# View resource usage
docker stats

# Rebuild without cache
docker-compose -f docker-compose-viton.yml build --no-cache

# Pull latest images
docker-compose -f docker-compose-viton.yml pull
```

## Troubleshooting

### Services won't start

**Error**: `No space left on device`
```bash
# Clean up Docker
docker system prune -a
docker volume prune
```

**Error**: `Cannot connect to Docker daemon`
```bash
# Make sure Docker Desktop is running
# Windows: Start Docker Desktop from Applications
# macOS: Start Docker Desktop from Applications
# Linux: sudo systemctl start docker
```

### VITON-HD service unhealthy

Check logs:
```bash
docker-compose -f docker-compose-viton.yml logs viton-hd-service
```

Common issues:
- Checkpoints not found → Download from Google Drive
- Out of memory → Reduce image size or use larger GPU
- CUDA not available → Ensure NVIDIA Runtime is installed

### Web app can't reach VITON-HD service

**For Docker Compose**: Use service name as hostname: `http://viton-hd-service:5000`

**For local testing**: Use `http://localhost:5000`

**Network debugging**:
```bash
docker-compose -f docker-compose-viton.yml exec web curl http://viton-hd-service:5000/health
```

### GPU not detected

Verify NVIDIA Container Runtime:
```bash
docker run --rm --runtime=nvidia nvidia/cuda:11.8.0-runtime-ubuntu22.04 nvidia-smi
```

If that fails, install NVIDIA Container Runtime from: https://github.com/NVIDIA/nvidia-docker

## Performance Tuning

### Reduce memory usage
Edit `viton_service/Dockerfile`:
```dockerfile
# Reduce image size in app.py
# Change: img.resize((1024, 768), Image.LANCZOS)
# To:     img.resize((512, 384), Image.LANCZOS)
```

### Increase throughput
Add multiple worker processes in `viton_service/app.py`:
```python
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, processes=2)
```

### Enable GPU caching
Use shared memory for GPU operations:
```bash
docker-compose -f docker-compose-viton.yml up --no-build \
  -e CUDA_DEVICE_ORDER=PCI_BUS_ID \
  -e CUDA_VISIBLE_DEVICES=0
```

## Monitoring

### Check GPU usage
```bash
docker exec viton-hd-service nvidia-smi
```

### Monitor performance
```bash
docker stats viton-hd-service
```

Expected resources (per request):
- CPU: 50-100%
- Memory: 2-3GB
- GPU: 70-90% utilization
- Time: 3-5 seconds per image

## Production Deployment

For production, consider:

1. **Use Docker Registry** (Docker Hub, ECR, GCR)
   ```bash
   docker tag viton-hd-service:latest myregistry/viton-hd:latest
   docker push myregistry/viton-hd:latest
   ```

2. **Use Kubernetes** instead of Docker Compose
   - Better scaling
   - Automatic restart
   - Load balancing

3. **Add monitoring** (Prometheus, Grafana)
   - Track inference times
   - Monitor GPU usage
   - Alert on errors

4. **Use reverse proxy** (Nginx)
   - Rate limiting
   - SSL/TLS
   - Load balancing

5. **Scale horizontally**
   - Run multiple VITON-HD instances
   - Use load balancer
   - Redis for caching

## Support

If you encounter issues:

1. Check logs: `docker-compose -f docker-compose-viton.yml logs -f`
2. Verify checkpoints are downloaded
3. Ensure GPU drivers are up to date
4. Check disk space: `docker system df`
5. Review VITON-HD requirements: https://github.com/shadow2496/VITON-HD

