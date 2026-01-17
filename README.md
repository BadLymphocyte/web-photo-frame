# Picture Slideshow App

A modern browser-based picture slideshow application with smooth transitions and advanced effects, designed to run in Docker containers.

## Features

- **Modern UI**: Clean, responsive interface built with TailwindCSS
- **Multiple Formats**: Supports JPG, PNG, GIF, WebP, and JXL (JPEG XL) images
- **Smooth Transitions**: Multiple transition types including:
  - Fade
  - Wipe (Left, Right, Up, Down)
  - Cube Rotate
  - Random transitions option
- **Slideshow Controls**: Play/pause, previous/next navigation
- **Adjustable Speed**: Configurable slideshow timing (1-10 seconds)
- **Thumbnail Navigation**: Visual thumbnail grid for quick image selection
- **Keyboard Shortcuts**: 
  - Arrow keys for navigation
  - Spacebar for play/pause
  - F key for fullscreen
  - Escape to exit fullscreen/close settings
- **Ken Burns Effect**: Optional zoom and pan effects
- **Fullscreen Mode**: Immersive viewing with auto-hiding controls
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
  - `F`: Toggle fullscreen
  - `Escape`: Exit fullscreen or close settings
- **Thumbnails**: Click any thumbnail to jump to that image

### Settings

Access the settings modal to customize:

- **Transitions**: Choose one or multiple transition types
  - Enable random transitions to mix them up
  - Adjust transition duration (0.1-2 seconds)
- **Ken Burns Effect**: Add cinematic zoom or pan effects
  - Zoom: Gradual zoom in/out
  - Pan: Smooth panning motion
  - Adjustable duration (5-20 seconds)
- **Slideshow**: 
  - Display speed (1-10 seconds per image)
  - Loop mode on/off
  - Start in fullscreen option

### Fullscreen Mode

- Click the fullscreen button or press `F` to enter fullscreen
- Controls auto-hide after 3 seconds of no mouse movement
- Move mouse to show controls again
- Controls remain visible when hovering over them
- Press `Escape` or click minimize to exit

## Supported Image Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- **JPEG XL (.jxl)** - Next-generation image format with superior compression

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
- **Server**: Express.js serving static files and API
- **Platform**: Linux

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
- **Backend**: Server logic is in the Dockerfile

## Troubleshooting

### Common Issues

1. **JXL Images Not Loading**
   - Ensure @jsquash/jxl library loads properly
   - Check browser console for decoder errors
   - Verify JXL files are valid
   - JXL files are converted to PNG in-browser for display

2. **Images Not Loading**
   - Check that images are in supported formats (JPG, PNG, GIF, WebP)
   - Verify file permissions
   - Check browser console for errors

2. **Docker Volume Issues**
   - Ensure `images/` directory exists
   - Check file permissions on the host
   - Verify volume mount path is correct

3. **Port Conflicts**
   - Change port mapping in docker-compose.yml
   - Ensure port 3000 is not in use

4. **Fullscreen Not Working**
   - Some browsers require user interaction before allowing fullscreen
   - Check browser permissions for fullscreen
   - Try a different browser (Chrome, Firefox recommended)

5. **Transitions Not Smooth**
   - Reduce transition duration in settings
   - Check if Ken Burns effect is interfering
   - Try different transition types

### Logs

Check container logs for debugging:
```bash
docker-compose logs picture-slideshow
```

## Browser Compatibility

Tested and working on:
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Tips

- Use optimized images (not too large)
- Disable Ken Burns effect for better performance on slower devices
- Use faster transition speeds for smoother experience
- Limit the number of images loaded at once

## Known Limitations

- JXL files are decoded in-browser and converted to PNG (requires JavaScript enabled)
- JXL decoding may be slower than native formats
- Browser storage APIs not available in the Claude.ai environment
- Maximum file upload size depends on server configuration

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

## Changelog

### v1.1 (Current)
- Fixed fullscreen display issues
- Replaced multi-select with checkboxes for transitions
- Added random transition support
- Improved control auto-hiding in fullscreen
- Fixed play/pause button state updates
- Re-added JXL support using @jsquash/jxl library
- Removed production warning for Tailwind CDN

### v1.0
- Initial release
- Basic slideshow functionality
- Multiple transition types
- Ken Burns effects
- Docker support