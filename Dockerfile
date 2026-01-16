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
const multer = require('multer');
const app = express();
const PORT = 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'images'));
  },
  filename: (req, file, cb) => {
    // Keep original filename
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/jxl'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.jxl'];
    
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Serve static files
app.use(express.static(__dirname));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.send(200);
});

// Upload endpoint
app.post('/api/upload', upload.array('images', 50), (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Files:', req.files ? req.files.length : 'none');
    
    if (!req.files || req.files.length === 0) {
      console.log('No files in request');
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const uploadedFiles = req.files.map(file => ({
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      path: '/images/' + file.originalname
    }));
    
    console.log('Processed files:', uploadedFiles.length);
    
    const response = { 
      success: true, 
      message: req.files.length + ' files uploaded successfully',
      files: uploadedFiles 
    };
    
    console.log('Sending response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('Upload error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Delete image endpoint
app.delete('/api/images/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'images', filename);
    
    // Security check - prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed', details: error.message });
  }
});

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

# Use entrypoint script to fix permissions
ENTRYPOINT ["./entrypoint.sh"]
