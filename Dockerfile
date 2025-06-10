# Use official Node.js image
FROM node:20

# Set the working directory
WORKDIR /usr/src/app

# Install Python and libraries needed
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    libjpeg-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libblas-dev \
    libatlas-base-dev \
    libpng-dev \
    libxml2-dev \
    libxslt1-dev \
    libssl-dev \
    libcurl4-openssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Create and activate Python virtual environment
RUN python3 -m venv /usr/src/app/venv
ENV PATH="/usr/src/app/venv/bin:$PATH"

# Copy Python requirements first (for better cache)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy Node.js files
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Copy env
COPY .env .env

# Expose app port
EXPOSE 4444

# Start Node.js app
CMD ["npm", "start"]
