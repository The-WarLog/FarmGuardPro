# Use a lightweight Python image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies (important for pillow & transformers)
RUN apt-get update && apt-get install -y \
    gcc \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages (split properly)
RUN pip install --no-cache-dir fastapi uvicorn python-multipart pillow transformers \
    && pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Copy your code
COPY main.py .

# Expose port (important for Azure)
EXPOSE 80

# Run the app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]