FROM nvidia/cuda:11.8.0-runtime-ubuntu22.04

WORKDIR /app

# Install Python and dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY viton_service/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Clone VITON-HD
RUN git clone https://github.com/shadow2496/VITON-HD.git

# Copy service files
COPY viton_service/app.py .
COPY viton_service/.env .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python3 -c "import requests; requests.get('http://localhost:5000/health')"

# Start service
CMD ["python3", "app.py"]
