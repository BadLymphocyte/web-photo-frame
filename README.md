# Picture Slideshow App

A modern browser-based picture slideshow application with JXL (JPEG XL) support, designed to run in Linux containers with Chromium compatibility.

## Features

- **Modern UI**: Clean, responsive interface built with TailwindCSS
- **JXL Support**: Full support for JPEG XL image format using jxl-wasm
- **Multiple Formats**: Supports JPG, PNG, GIF, WebP, and JXL images
- **Slideshow Controls**: Play/pause, previous/next navigation
- **Adjustable Speed**: Configurable slideshow timing (1-10 seconds)
- **Thumbnail Navigation**: Visual thumbnail grid for quick image selection
- **Keyboard Shortcuts**: Arrow keys for navigation, spacebar for play/pause
- **Drag & Drop**: Support for dragging images directly into the app
- **Loop Mode**: Optional looping of slideshow
- **Docker Support**: Runs in Linux containers with volume persistence

## Quick Start

### Using Docker Compose (Recommended)

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd picture-slideshow
   ```

2. **Add your images**
   ```bash
   # Place your images in the images directory
   cp your-images/* images/
   ```

3. **Start the application**
   ```bash
   docker-compose up --build
   ```

4. **Access the app**
   Open your browser and navigate to `http://localhost:3000`

### Manual Docker Build

1. **Build the Docker image**
   ```bash
   docker build -t picture-slideshow .
   ```

2. **Run the container with volume**
   ```bash
   docker run -d \
     --name picture-slideshow \
     -p 3000:3000 \
     -v $(pwd)/images:/app/images \
     picture-slideshow
   ```

## Usage

### Adding Images

1. **Upload Button**: Click the "Upload Images" button to select files
2. **Drag & Drop**: Drag image files directly onto the page
3. **Volume Mount**: Place images in the `images/` directory (when using Docker)

### Navigation

- **Previous/Next Buttons**: Use the control buttons at the bottom
- **Keyboard**: 
  - `←` Arrow: Previous image
  - `→` Arrow: Next image  
  - `Space`: Play/Pause slideshow
- **Thumbnails**: Click any thumbnail to jump to that image

### Slideshow Settings

- **Speed Control**: Adjust the slider to change display timing (1-10 seconds)
- **Loop Mode**: Toggle the checkbox to enable/disable looping

## Supported Image Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- **JPEG XL (.jxl)** - Next-generation image format

## Project Structure

```
picture-slideshow/
├── index.html          # Main HTML interface
├── script.js           # JavaScript functionality
├── Dockerfile          # Container configuration
├── docker-compose.yml  # Docker Compose setup
├── package.json        # Node.js dependencies
├── images/             # Image storage directory
└── README.md           # This file
```

## Docker Configuration

### Docker Compose Features

- **Volume Mounting**: Images are stored persistently in `./images`
- **Port Mapping**: Service accessible on port 3000
- **Network Isolation**: Uses dedicated Docker network
- **Auto-restart**: Container restarts automatically unless stopped

### Container Specifications

- **Base Image**: Node.js 18 Alpine
- **Browser**: Chromium for Linux compatibility
- **Server**: Express.js serving static files and API
- **Platform**: Linux (compatible with Chromium)

## Development

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm start
   ```

3. **Open browser**
   Navigate to `http://localhost:3000`

### Adding New Features

The application is structured for easy extension:

- **UI Components**: Modify `index.html` for layout changes
- **Functionality**: Update `script.js` for new features
- **Styling**: Adjust TailwindCSS classes in `index.html`
- **Backend**: Modify server logic in `Dockerfile` (server.js section)

## Troubleshooting

### Common Issues

1. **JXL Images Not Loading**
   - Ensure jxl-wasm library loads properly
   - Check browser console for errors
   - Verify JXL files are valid

2. **Docker Volume Issues**
   - Ensure `images/` directory exists
   - Check file permissions on the host
   - Verify volume mount path is correct

3. **Port Conflicts**
   - Change port mapping in docker-compose.yml
   - Ensure port 3000 is not in use

4. **Chromium Compatibility**
   - The app uses Chromium for Linux compatibility
   - All modern browsers should work for viewing
   - JXL support requires JavaScript/WASM capabilities

### Logs

Check container logs for debugging:
```bash
docker-compose logs picture-slideshow
```

## License

MIT License - feel free to use and modify for your needs.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section
- Review Docker logs
- Verify browser compatibility
- Ensure all dependencies are installed
