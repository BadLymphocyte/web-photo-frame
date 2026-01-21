# Picture Slideshow App

A modern browser-based picture slideshow application with smooth transitions and advanced effects, designed to run in Docker containers.

## Features

- **Modern UI**: Clean, responsive interface built with TailwindCSS
- **Multiple Formats**: Supports JPG, PNG, GIF, WebP, and JXL (JPEG XL) images
- **Smooth Transitions**: Multiple transition types including:
  - Fade
  - Dissolve
  - Zoom In/Out
  - Blur
  - Slide
  - Wipe (Left, Right, Up, Down)
  - Cube Rotate
  - Random transitions (select multiple)
- **Auto-Start**: Slideshow begins automatically when page loads
- **Slideshow Controls**: Play/pause, previous/next navigation
- **Adjustable Speed**: Configurable slideshow timing (3-600 seconds)
- **Keyboard Shortcuts**: 
  - Arrow keys for navigation
  - Spacebar for play/pause
  - F key for fullscreen
  - Escape to exit fullscreen/close settings
- **Fullscreen Mode**: Immersive viewing with auto-hiding controls and hidden image counter
- **Random Order**: Optional random image display with anti-repeat logic
- **Loop Mode**: Optional looping of slideshow
- **Settings Persistence**: All settings saved to browser localStorage
- **Docker Support**: Runs in Linux containers with volume persistence
- **Watchtower Compatible**: Can be excluded from automatic updates

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

Place images in the `images/` directory (or subdirectories). The app automatically scans for images on startup.

**Supported methods:**
- **Volume Mount**: Place images in the `./images` directory when using Docker
- **Direct Copy**: Copy images to the images folder on the server
- **Subdirectories**: Images in subdirectories are automatically discovered

### Navigation

- **Auto-Start**: Slideshow begins automatically when page loads
- **Previous/Next Buttons**: Use the control buttons at the bottom
- **Keyboard**: 
  - `←` Arrow: Previous image
  - `→` Arrow: Next image  
  - `Space`: Play/Pause slideshow
  - `F`: Toggle fullscreen
  - `Escape`: Exit fullscreen or close settings

### Settings

Click the settings button (⚙️) to access the settings modal:

**Slideshow Settings:**
- **Display Time**: 3-600 seconds per image
- **Loop**: Enable/disable continuous looping
- **Random Order**: Shuffle images with anti-repeat logic
- **Start in Fullscreen**: Auto-enter fullscreen on page load

**Transition Settings:**
- **Duration**: 0.1-2.0 seconds
- **Effects**: Select one or multiple transition types:
  - Fade, Dissolve, Zoom In/Out, Blur, Slide
  - Wipe (Left/Right/Up/Down), Cube, None
- **Random**: When multiple transitions selected, randomly picks one per image

**Settings Persistence:**
- All settings automatically saved to browser localStorage
- Settings restored on page reload
- Reset to defaults button available

### Fullscreen Mode

- Click the fullscreen button or press `F` to enter fullscreen
- Image counter automatically hidden in fullscreen
- Controls auto-hide after 3 seconds of no mouse movement
- Move mouse to show controls again
- Controls remain visible when hovering over them
- Press `Escape` or click minimize to exit

## Supported Image Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- **JPEG XL (.jxl)** - Requires browser with native JXL support (Chrome 113+, Edge 113+, or browsers with JXL flag enabled)

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
   - JXL format requires browser native support
   - Enable JXL in Chrome/Edge: `chrome://flags/#enable-jxl`
   - Firefox: JXL support available in Firefox 90+ with flag enabled
   - Safari: JXL not yet supported
   - Alternative: Convert JXL to WebP or PNG for broader compatibility

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
   - Try simpler transition types (fade, dissolve)
   - Check browser performance and close other tabs

6. **New Images Not Appearing**
   - Restart the Docker container to rescan the images directory
   - Verify images are in supported formats
   - Check subdirectory permissions

### Logs

Check container logs for debugging:
```bash
docker-compose logs picture-slideshow
```

## Browser Compatibility

Tested and working on:
- Chrome/Chromium 90+ (JXL support in 113+ or with flag)
- Firefox 88+ (JXL support with flag enabled)
- Safari 14+ (JXL not supported)
- Edge 90+ (JXL support in 113+ or with flag)

### Enabling JXL Support
- **Chrome/Edge**: Navigate to `chrome://flags/#enable-jxl` and enable
- **Firefox**: Navigate to `about:config` and set `image.jxl.enabled` to `true`

## Performance Tips

- Use optimized images (not too large)
- Use faster transition speeds for smoother experience
- Reduce transition duration for better performance on slower devices
- Consider using simpler transitions (fade, dissolve) on older hardware
- Images are loaded on-demand to minimize memory usage

## Known Limitations

- JXL files require browser with native JXL support enabled
- Not all browsers support JXL format natively
- Settings stored in browser localStorage (cleared if browser data is cleared)
- Image scanning happens on server startup (restart to detect new images)

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

### v2.0 (Current)
- **Settings System Rewrite**: Complete overhaul for reliability and maintainability
  - New form-based settings modal with better UX
  - Proper FormData API usage for data handling
  - Improved error handling and validation
  - Settings persistence with localStorage
  - Cancel button to discard changes
- **Auto-Start Feature**: Slideshow begins automatically on page load
- **UI Improvements**:
  - Removed thumbnail panel for cleaner interface
  - Image counter hidden in fullscreen mode
  - Speed setting now text input (3-600 seconds range)
- **New Transitions**: Added dissolve, zoom in/out, blur effects
- **Random Order**: Shuffle images with anti-repeat logic
- **Server-Side Image Scanning**: Automatic recursive directory scanning
- **Watchtower Support**: Container can be excluded from auto-updates
- **Bug Fixes**: Fixed image display issues, layout problems, and control visibility

### v1.1
- Fixed fullscreen display issues
- Replaced multi-select with checkboxes for transitions
- Added random transition support
- Improved control auto-hiding in fullscreen
- Fixed play/pause button state updates
- Added JXL support (requires browser native support)
- Fixed Tailwind CDN warning suppression
- Fixed undefined element errors in settings

### v1.0
- Initial release
- Basic slideshow functionality
- Multiple transition types
- Docker support