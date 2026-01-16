FROM node:18-alpine

# Install Chromium for Linux compatibility
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Chromium environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Create images directory for volume mount
RUN mkdir -p /app/images

# Create a simple Express server to serve the app
RUN cat > server.js << 'EOF'
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(__dirname));
app.use('/images', express.static(path.join(__dirname, 'images')));

// API endpoint to list images in the images directory
app.get('/api/images', (req, res) => {
    const imagesDir = path.join(__dirname, 'images');
    
    try {
        const files = fs.readdirSync(imagesDir);
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.jxl'].includes(ext);
        });
        
        const images = imageFiles.map(file => {
            const filePath = path.join(imagesDir, file);
            const stats = fs.statSync(filePath);
            const ext = path.extname(file).toLowerCase();
            
            let mimeType = 'image/jpeg';
            switch(ext) {
                case '.png': mimeType = 'image/png'; break;
                case '.gif': mimeType = 'image/gif'; break;
                case '.webp': mimeType = 'image/webp'; break;
                case '.jxl': mimeType = 'image/jxl'; break;
            }
            
            return {
                name: file,
                type: mimeType,
                size: stats.size,
                modified: stats.mtime
            };
        });
        
        res.json(images);
    } catch (error) {
        console.error('Error reading images directory:', error);
        res.json([]);
    }
});

// Serve the main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Picture Slideshow app running on http://localhost:${PORT}`);
    console.log(`Images directory: ${path.join(__dirname, 'images')}`);
});
EOF

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
