FROM node:18-alpine

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

# Create data directory for uploads  
RUN mkdir -p /app/data

# Create entrypoint script to fix permissions
RUN cat > entrypoint.sh << 'EOF'
#!/bin/sh
# Fix permissions on mounted volumes
chmod -R 777 /app/images 2>/dev/null || true
chmod -R 777 /app/data 2>/dev/null || true

# Start the application
exec node server.js
EOF

RUN chmod +x entrypoint.sh

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

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Recursive function to scan directories for images
function scanImagesRecursively(dir, baseDir = dir) {
    let images = [];
    
    try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
            const fullPath = path.join(dir, item.name);
            
            if (item.isDirectory()) {
                // Recursively scan subdirectories
                images = images.concat(scanImagesRecursively(fullPath, baseDir));
            } else if (item.isFile()) {
                const ext = path.extname(item.name).toLowerCase();
                if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.jxl'].includes(ext)) {
                    const stats = fs.statSync(fullPath);
                    const relativePath = path.relative(baseDir, fullPath);
                    
                    let mimeType = 'image/jpeg';
                    switch(ext) {
                        case '.png': mimeType = 'image/png'; break;
                        case '.gif': mimeType = 'image/gif'; break;
                        case '.webp': mimeType = 'image/webp'; break;
                        case '.jxl': mimeType = 'image/jxl'; break;
                    }
                    
                    images.push({
                        name: item.name,
                        path: relativePath.replace(/\\\\/g, '/'),
                        type: mimeType,
                        size: stats.size,
                        modified: stats.mtime
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error scanning directory:', dir, error);
    }
    
    return images;
}

// API endpoint to list all images recursively
app.get('/api/images', (req, res) => {
    const imagesDir = path.join(__dirname, 'images');
    
    try {
        if (!fs.existsSync(imagesDir)) {
            console.log('Images directory does not exist, creating it...');
            fs.mkdirSync(imagesDir, { recursive: true });
            return res.json([]);
        }
        
        const images = scanImagesRecursively(imagesDir);
        console.log(`Found ${images.length} images in ${imagesDir} and subdirectories`);
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

# Use entrypoint script to fix permissions
ENTRYPOINT ["./entrypoint.sh"]
