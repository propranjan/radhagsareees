FROM nvidia/cuda:11.8.0-runtime-ubuntu22.04

WORKDIR /app

# Install Python and build dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    git \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY viton_service/requirements.txt requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Clone VITON-HD if not already present
RUN if [ ! -d "VITON-HD" ]; then \
    echo "Cloning VITON-HD repository..." && \
    git clone https://github.com/shadow2496/VITON-HD.git; \
    fi

# Copy service files
COPY viton_service/app.py app.py
COPY viton_service/.env .env

# Create directories for checkpoints and results
RUN mkdir -p VITON-HD/checkpoints VITON-HD/datasets results

# Set Python to run in unbuffered mode for better logging
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python3 -c "import requests; r = requests.get('http://localhost:5000/health'); exit(0 if r.status_code == 200 else 1)" || exit 1

# Start service
CMD ["python3", "app.py"]
