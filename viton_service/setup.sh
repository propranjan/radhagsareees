#!/bin/bash
# Setup VITON-HD service

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Clone VITON-HD if not exists
if [ ! -d "VITON-HD" ]; then
    echo "Cloning VITON-HD repository..."
    git clone https://github.com/shadow2496/VITON-HD.git
fi

# Download checkpoints (requires Google Drive access)
echo "Please download checkpoints from: https://drive.google.com/drive/folders/0B8kXrnobEVh9fnJHX3lCZzEtd20yUVAtTk5HdWk2OVV0RGl6YXc0NWhMOTlvb1FKX3Z1OUk"
echo "Extract to: VITON-HD/checkpoints/"

echo "Setup complete! Run: python app.py"
