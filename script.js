class PictureSlideshow {
    constructor() {
        this.images = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.slideInterval = null;
        this.slideSpeed = 3000; // 3 seconds default
        this.loop = true;
        this.jxlDecoder = null;
        
        // Transition and effect settings
        this.transitionType = 'fade';
        this.fadeDuration = 0.5;
        this.kenBurnsEnabled = false;
        this.kenBurnsType = 'zoom';
        this.kenBurnsDuration = 10;
        this.isFullscreen = false;
        this.startInFullscreen = false;
        this.isTransitioning = false;
        
        // Check URL parameters
        this.checkURLParameters();
        
        this.initializeElements();
        this.attachEventListeners();
        this.initializeJXL();
        this.loadSettings();
        this.loadImagesFromServer();
        this.updateUI();
        
        // Start in fullscreen if requested
        if (this.startInFullscreen) {
            this.enterFullscreen();
        }
    }

    initializeElements() {
        this.elements = {
            fileInput: document.getElementById('fileInput'),
            uploadBtn: document.getElementById('uploadBtn'),
            currentImage: document.getElementById('currentImage'),
            nextImage: document.getElementById('nextImage'),
            noImagesMessage: document.getElementById('noImagesMessage'),
            controls: document.getElementById('controls'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            playPauseBtn: document.getElementById('playPauseBtn'),
            thumbnailContainer: document.getElementById('thumbnailContainer'),
            speedSlider: document.getElementById('speedSlider'),
            speedValue: document.getElementById('speedValue'),
            loopCheckbox: document.getElementById('loopCheckbox'),
            currentIndex: document.getElementById('currentIndex'),
            totalImages: document.getElementById('totalImages'),
            imageCounter: document.getElementById('imageCounter'),
            // Settings modal elements
            settingsBtn: document.getElementById('settingsBtn'),
            settingsModal: document.getElementById('settingsModal'),
            closeSettingsBtn: document.getElementById('closeSettingsBtn'),
            transitionType: document.getElementById('transitionType'),
            fadeDuration: document.getElementById('fadeDuration'),
            fadeDurationValue: document.getElementById('fadeDurationValue'),
            kenBurnsEnabled: document.getElementById('kenBurnsEnabled'),
            kenBurnsType: document.getElementById('kenBurnsType'),
            kenBurnsDuration: document.getElementById('kenBurnsDuration'),
            kenBurnsDurationValue: document.getElementById('kenBurnsDurationValue'),
            startFullscreenCheckbox: document.getElementById('startFullscreenCheckbox'),
            saveSettingsBtn: document.getElementById('saveSettingsBtn'),
            resetSettingsBtn: document.getElementById('resetSettingsBtn'),
            // Fullscreen
            fullscreenBtn: document.getElementById('fullscreenBtn')
        };
    }

    attachEventListeners() {
        this.elements.uploadBtn.addEventListener('click', () => {
            this.elements.fileInput.click();
        });

        this.elements.fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });

        this.elements.prevBtn.addEventListener('click', () => {
            this.previousImage();
        });

        this.elements.nextBtn.addEventListener('click', () => {
            this.nextImage();
        });

        this.elements.playPauseBtn.addEventListener('click', () => {
            this.togglePlayPause();
        });

        this.elements.speedSlider.addEventListener('input', (e) => {
            this.slideSpeed = e.target.value * 1000;
            this.elements.speedValue.textContent = `${e.target.value}s`;
            if (this.isPlaying) {
                this.stopSlideshow();
                this.startSlideshow();
            }
        });

        this.elements.loopCheckbox.addEventListener('change', (e) => {
            this.loop = e.target.checked;
        });

        // Settings modal event listeners
        this.elements.settingsBtn.addEventListener('click', () => {
            this.openSettingsModal();
        });

        this.elements.closeSettingsBtn.addEventListener('click', () => {
            this.closeSettingsModal();
        });

        this.elements.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsModal) {
                this.closeSettingsModal();
            }
        });

        this.elements.transitionType.addEventListener('change', (e) => {
            this.transitionType = e.target.value;
        });

        this.elements.fadeDuration.addEventListener('input', (e) => {
            this.fadeDuration = parseFloat(e.target.value);
            this.elements.fadeDurationValue.textContent = `${this.fadeDuration}s`;
            this.updateCSSVariables();
        });

        this.elements.kenBurnsEnabled.addEventListener('change', (e) => {
            this.kenBurnsEnabled = e.target.checked;
            this.elements.kenBurnsType.disabled = !this.kenBurnsEnabled;
            this.elements.kenBurnsDuration.disabled = !this.kenBurnsEnabled;
            this.applyKenBurnsEffect();
        });

        this.elements.kenBurnsType.addEventListener('change', (e) => {
            this.kenBurnsType = e.target.value;
            this.applyKenBurnsEffect();
        });

        this.elements.kenBurnsDuration.addEventListener('input', (e) => {
            this.kenBurnsDuration = parseInt(e.target.value);
            this.elements.kenBurnsDurationValue.textContent = `${this.kenBurnsDuration}s`;
            this.updateCSSVariables();
        });

        this.elements.startFullscreenCheckbox.addEventListener('change', (e) => {
            this.startInFullscreen = e.target.checked;
        });

        this.elements.saveSettingsBtn.addEventListener('click', () => {
            this.saveSettings();
            this.closeSettingsModal();
        });

        this.elements.resetSettingsBtn.addEventListener('click', () => {
            this.resetSettings();
        });

        // Fullscreen event listener
        this.elements.fullscreenBtn.addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Fullscreen change event listener
        document.addEventListener('fullscreenchange', () => {
            this.isFullscreen = !!document.fullscreenElement;
            this.updateFullscreenButton();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    this.previousImage();
                    break;
                case 'ArrowRight':
                    this.nextImage();
                    break;
                case ' ':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'f':
                case 'F':
                    this.toggleFullscreen();
                    break;
                case 'Escape':
                    if (this.isFullscreen) {
                        this.exitFullscreen();
                    }
                    if (this.elements.settingsModal.classList.contains('active')) {
                        this.closeSettingsModal();
                    }
                    break;
            }
        });

        // Drag and drop
        const dropZone = document.body;
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('bg-gray-700');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('bg-gray-700');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('bg-gray-700');
            this.handleFileUpload(e.dataTransfer.files);
        });
    }

    async initializeJXL() {
        try {
            // Initialize JXL decoder
            if (typeof JxlWasm !== 'undefined') {
                this.jxlDecoder = await JxlWasm();
            }
        } catch (error) {
            console.warn('JXL support not available:', error);
        }
    }

    async handleFileUpload(files) {
        try {
            console.log('Starting upload for', files.length, 'files');
            
            const formData = new FormData();
            
            // Add all files to FormData
            Array.from(files).forEach(file => {
                if (this.isImageFile(file)) {
                    console.log('Adding file:', file.name, file.type, file.size);
                    formData.append('images', file);
                }
            });

            // Upload to server
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            const responseText = await response.text();
            console.log('Raw response:', responseText);

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response text was:', responseText);
                this.showNotification('Invalid server response', 'error');
                return;
            }

            if (result.success) {
                // Refresh images list from server
                await this.loadImagesFromServer();
                this.showNotification(result.message, 'success');
            } else {
                this.showNotification(result.error || 'Upload failed', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            console.error('Error stack:', error.stack);
            this.showNotification('Upload failed: ' + error.message, 'error');
        }
    }

    async loadImagesFromServer() {
        try {
            const response = await fetch('/api/images');
            const serverImages = await response.json();
            
            // Convert server images to client format
            this.images = serverImages.map(img => ({
                name: img.name,
                url: `/images/${encodeURIComponent(img.name)}`,
                type: img.type,
                size: img.size
            }));
            
            this.updateUI();
            this.createThumbnails();
            
            // Show first image if available
            if (this.images.length > 0 && this.currentIndex >= this.images.length) {
                this.currentIndex = 0;
                this.showCurrentImage();
            }
        } catch (error) {
            console.error('Error loading images from server:', error);
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50 transition-all duration-300 ${
            type === 'success' ? 'bg-green-600' : 
            type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    isImageFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/jxl'];
        return validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.jxl');
    }

    async processImageFile(file) {
        if (file.type === 'image/jxl' || file.name.toLowerCase().endsWith('.jxl')) {
            return await this.processJXLFile(file);
        } else {
            return this.processRegularImageFile(file);
        }
    }

    async processJXLFile(file) {
        if (!this.jxlDecoder) {
            console.error('JXL decoder not available');
            return null;
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const imageData = this.jxlDecoder.decode(uint8Array);
            
            // Create blob from decoded image data
            const blob = new Blob([imageData], { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            
            return { url };
        } catch (error) {
            console.error('Error processing JXL file:', error);
            return null;
        }
    }

    processRegularImageFile(file) {
        const url = URL.createObjectURL(file);
        return { url };
    }

    createThumbnails() {
        this.elements.thumbnailContainer.innerHTML = '';
        
        this.images.forEach((image, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = `thumbnail cursor-pointer rounded overflow-hidden bg-gray-700 ${index === this.currentIndex ? 'ring-2 ring-blue-500' : ''}`;
            thumbnail.innerHTML = `
                <img src="${image.url}" alt="${image.name}" class="w-full h-20 object-cover">
            `;
            
            thumbnail.addEventListener('click', () => {
                this.currentIndex = index;
                this.showCurrentImage();
                this.updateThumbnailSelection();
            });
            
            this.elements.thumbnailContainer.appendChild(thumbnail);
        });
    }

    updateThumbnailSelection() {
        const thumbnails = this.elements.thumbnailContainer.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumb, index) => {
            if (index === this.currentIndex) {
                thumb.classList.add('ring-2', 'ring-blue-500');
            } else {
                thumb.classList.remove('ring-2', 'ring-blue-500');
            }
        });
    }

    showCurrentImage() {
        if (this.images.length === 0) return;

        const currentImage = this.images[this.currentIndex];
        
        if (this.isTransitioning) {
            return;
        }
        
        this.isTransitioning = true;
        
        // Apply transition if enabled
        if (this.transitionType !== 'none') {
            this.applyTransition(currentImage.url);
        } else {
            this.elements.currentImage.src = currentImage.url;
            this.elements.currentImage.classList.remove('hidden');
            this.elements.noImagesMessage.classList.add('hidden');
            this.elements.controls.classList.remove('hidden');
            this.elements.imageCounter.classList.remove('hidden');
            this.isTransitioning = false;
        }
        
        this.elements.currentIndex.textContent = this.currentIndex + 1;
        this.elements.totalImages.textContent = this.images.length;
        
        this.updateThumbnailSelection();
        this.applyKenBurnsEffect();
    }

    previousImage() {
        if (this.images.length === 0) return;
        
        this.currentIndex = this.currentIndex === 0 
            ? this.loop ? this.images.length - 1 : 0
            : this.currentIndex - 1;
        
        this.showCurrentImage();
    }

    nextImage() {
        if (this.images.length === 0) return;
        
        this.currentIndex = this.currentIndex === this.images.length - 1 
            ? this.loop ? 0 : this.images.length - 1
            : this.currentIndex + 1;
        
        this.showCurrentImage();
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.stopSlideshow();
        } else {
            this.startSlideshow();
        }
    }

    startSlideshow() {
        if (this.images.length === 0) return;
        
        this.isPlaying = true;
        const playIcon = this.elements.playPauseBtn.querySelector('i');
        playIcon.setAttribute('data-lucide', 'pause');
        lucide.createIcons();
        
        // Update minimal controls if in fullscreen
        this.updateMinimalPlayPauseButton();
        
        this.slideInterval = setInterval(() => {
            this.nextImage();
        }, this.slideSpeed);
    }

    stopSlideshow() {
        this.isPlaying = false;
        const playIcon = this.elements.playPauseBtn.querySelector('i');
        playIcon.setAttribute('data-lucide', 'play');
        lucide.createIcons();
        
        // Update minimal controls if in fullscreen
        this.updateMinimalPlayPauseButton();
        
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
            this.slideInterval = null;
        }
    }

    updateUI() {
        if (this.images.length === 0) {
            this.elements.currentImage.classList.add('hidden');
            this.elements.noImagesMessage.classList.remove('hidden');
            this.elements.controls.classList.add('hidden');
            this.elements.imageCounter.classList.add('hidden');
            this.elements.thumbnailContainer.innerHTML = '<p class="text-gray-400 text-sm">No images uploaded</p>';
        } else {
            this.showCurrentImage();
            this.createThumbnails();
        }
    }

    saveImagesToStorage() {
        // In a real application, you might want to save to localStorage or a server
        // For now, we'll just keep images in memory
        localStorage.setItem('slideshowImages', JSON.stringify(this.images.map(img => ({
            name: img.name,
            type: img.type,
            size: img.size
        }))));
    }

    loadStoredImages() {
        // Load image metadata from localStorage
        const stored = localStorage.getItem('slideshowImages');
        if (stored) {
            try {
                const imageData = JSON.parse(stored);
                // Note: In a real app, you'd need to handle URL recreation
                // For now, we'll start with empty images
            } catch (error) {
                console.error('Error loading stored images:', error);
            }
        }
    }

    // Method to load images from a directory (for server-side implementation)
    async loadImagesFromDirectory(directoryPath) {
        try {
            const response = await fetch(`/api/images?dir=${encodeURIComponent(directoryPath)}`);
            const images = await response.json();
            
            this.images = images.map(img => ({
                name: img.name,
                url: `/images/${encodeURIComponent(img.name)}`,
                type: img.type,
                size: img.size
            }));
            
            this.updateUI();
            this.createThumbnails();
        } catch (error) {
            console.error('Error loading images from directory:', error);
        }
    }

    // Transition methods
    applyTransition(imageUrl) {
        const currentImg = this.elements.currentImage;
        const nextImg = this.elements.nextImage;
        
        // Set up the next image
        nextImg.src = imageUrl;
        nextImg.classList.remove('hidden');
        
        // Remove any existing transition classes
        currentImg.className = 'slideshow-image';
        nextImg.className = 'slideshow-image';
        
        // Apply transition based on type
        switch (this.transitionType) {
            case 'fade':
                this.applyFadeTransition(currentImg, nextImg);
                break;
            case 'wipe-left':
                this.applyWipeTransition(currentImg, nextImg, 'wipe-left');
                break;
            case 'wipe-right':
                this.applyWipeTransition(currentImg, nextImg, 'wipe-right');
                break;
            case 'wipe-up':
                this.applyWipeTransition(currentImg, nextImg, 'wipe-up');
                break;
            case 'wipe-down':
                this.applyWipeTransition(currentImg, nextImg, 'wipe-down');
                break;
            case 'cube':
                this.applyCubeTransition(currentImg, nextImg);
                break;
            default:
                this.applyDirectTransition(currentImg, nextImg);
        }
    }

    applyFadeTransition(currentImg, nextImg) {
        nextImg.style.opacity = '0';
        nextImg.style.transition = `opacity ${this.fadeDuration}s ease-in-out`;
        
        nextImg.offsetHeight; // Force reflow
        
        nextImg.style.opacity = '1';
        
        setTimeout(() => {
            currentImg.classList.add('hidden');
            currentImg.style.opacity = '1';
            currentImg.style.transition = '';
            this.elements.currentImage.src = nextImg.src;
            nextImg.classList.add('hidden');
            this.isTransitioning = false;
        }, this.fadeDuration * 1000);
    }

    applyWipeTransition(currentImg, nextImg, direction) {
        const transforms = {
            'wipe-left': ['translateX(100%)', 'translateX(0)'],
            'wipe-right': ['translateX(-100%)', 'translateX(0)'],
            'wipe-up': ['translateY(100%)', 'translateY(0)'],
            'wipe-down': ['translateY(-100%)', 'translateY(0)']
        };
        
        const [startTransform, endTransform] = transforms[direction];
        
        nextImg.style.transform = startTransform;
        nextImg.style.transition = `transform ${this.fadeDuration}s ease-in-out`;
        
        nextImg.offsetHeight; // Force reflow
        
        nextImg.style.transform = endTransform;
        
        setTimeout(() => {
            currentImg.classList.add('hidden');
            currentImg.style.transform = '';
            currentImg.style.transition = '';
            this.elements.currentImage.src = nextImg.src;
            nextImg.classList.add('hidden');
            nextImg.style.transform = '';
            nextImg.style.transition = '';
            this.isTransitioning = false;
        }, this.fadeDuration * 1000);
    }

    applyCubeTransition(currentImg, nextImg) {
        const container = this.elements.imageContainer;
        container.style.perspective = '1000px';
        
        currentImg.style.transition = `transform ${this.fadeDuration}s ease-in-out`;
        currentImg.style.transformStyle = 'preserve-3d';
        
        nextImg.style.transform = 'rotateY(-90deg)';
        nextImg.style.transition = `transform ${this.fadeDuration}s ease-in-out`;
        nextImg.style.transformStyle = 'preserve-3d';
        nextImg.classList.remove('hidden');
        
        nextImg.offsetHeight; // Force reflow
        
        currentImg.style.transform = 'rotateY(90deg)';
        nextImg.style.transform = 'rotateY(0deg)';
        
        setTimeout(() => {
            currentImg.classList.add('hidden');
            currentImg.style.transform = '';
            currentImg.style.transition = '';
            currentImg.style.transformStyle = '';
            this.elements.currentImage.src = nextImg.src;
            nextImg.classList.add('hidden');
            nextImg.style.transform = '';
            nextImg.style.transition = '';
            nextImg.style.transformStyle = '';
            container.style.perspective = '';
            this.isTransitioning = false;
        }, this.fadeDuration * 1000);
    }

    applyDirectTransition(currentImg, nextImg) {
        this.elements.currentImage.src = nextImg.src;
        nextImg.classList.add('hidden');
        this.isTransitioning = false;
    }

    // Ken Burns effect methods
    applyKenBurnsEffect() {
        const currentImg = this.elements.currentImage;
        
        // Remove existing Ken Burns classes
        currentImg.classList.remove('ken-burns', 'ken-burns-pan');
        
        if (this.kenBurnsEnabled && !currentImg.classList.contains('hidden')) {
            if (this.kenBurnsType === 'zoom') {
                currentImg.classList.add('ken-burns');
            } else if (this.kenBurnsType === 'pan') {
                currentImg.classList.add('ken-burns-pan');
            }
        }
    }

    // Fullscreen methods
    toggleFullscreen() {
        if (this.isFullscreen) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen();
        }
    }

    enterFullscreen() {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
        
        // Hide UI elements for image-only fullscreen
        this.hideUIForFullscreen();
    }

    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        
        // Show UI elements when exiting fullscreen
        this.showUIForFullscreen();
    }

    hideUIForFullscreen() {
        // Hide header, footer, sidebar, and controls
        const header = document.querySelector('header');
        const footer = document.querySelector('footer');
        const sidebar = document.querySelector('aside');
        const controls = document.getElementById('controls');
        const counter = document.getElementById('imageCounter');
        
        if (header) header.style.display = 'none';
        if (footer) footer.style.display = 'none';
        if (sidebar) sidebar.style.display = 'none';
        if (controls) controls.style.display = 'none';
        if (counter) counter.style.display = 'none';
        
        // Make image container take full screen
        const imageContainer = document.getElementById('imageContainer');
        const mainSection = document.querySelector('main section');
        
        if (imageContainer) {
            imageContainer.style.height = '100vh';
            imageContainer.style.width = '100vw';
            imageContainer.style.margin = '0';
            imageContainer.style.padding = '0';
            imageContainer.style.borderRadius = '0';
            imageContainer.style.background = 'black';
        }
        
        if (mainSection) {
            mainSection.style.margin = '0';
            mainSection.style.padding = '0';
            mainSection.style.borderRadius = '0';
            mainSection.style.background = 'black';
        }
        
        // Add minimal floating controls that appear on hover
        this.createMinimalFullscreenControls();
    }

    showUIForFullscreen() {
        // Restore all UI elements
        const header = document.querySelector('header');
        const footer = document.querySelector('footer');
        const sidebar = document.querySelector('aside');
        const controls = document.getElementById('controls');
        const counter = document.getElementById('imageCounter');
        
        if (header) header.style.display = '';
        if (footer) footer.style.display = '';
        if (sidebar) sidebar.style.display = '';
        if (controls) controls.style.display = '';
        if (counter) counter.style.display = '';
        
        // Restore original styling
        const imageContainer = document.getElementById('imageContainer');
        const mainSection = document.querySelector('main section');
        
        if (imageContainer) {
            imageContainer.style.height = '';
            imageContainer.style.width = '';
            imageContainer.style.margin = '';
            imageContainer.style.padding = '';
            imageContainer.style.borderRadius = '';
            imageContainer.style.background = '';
        }
        
        if (mainSection) {
            mainSection.style.margin = '';
            mainSection.style.padding = '';
            mainSection.style.borderRadius = '';
            mainSection.style.background = '';
        }
        
        // Remove minimal controls
        this.removeMinimalFullscreenControls();
    }

    createMinimalFullscreenControls() {
        // Create floating controls for fullscreen mode
        const controlsDiv = document.createElement('div');
        controlsDiv.id = 'minimalFullscreenControls';
        controlsDiv.className = 'fixed top-4 right-4 flex items-center gap-2 bg-black bg-opacity-50 rounded-lg p-2 opacity-0 transition-opacity duration-300 z-50';
        controlsDiv.innerHTML = `
            <button id="fsPrevBtn" class="p-2 hover:bg-white hover:bg-opacity-20 rounded transition-colors">
                <i data-lucide="chevron-left" class="w-5 h-5 text-white"></i>
            </button>
            <button id="fsPlayPauseBtn" class="p-2 hover:bg-white hover:bg-opacity-20 rounded transition-colors">
                <i data-lucide="play" class="w-5 h-5 text-white"></i>
            </button>
            <button id="fsNextBtn" class="p-2 hover:bg-white hover:bg-opacity-20 rounded transition-colors">
                <i data-lucide="chevron-right" class="w-5 h-5 text-white"></i>
            </button>
            <button id="fsExitBtn" class="p-2 hover:bg-white hover:bg-opacity-20 rounded transition-colors">
                <i data-lucide="minimize" class="w-5 h-5 text-white"></i>
            </button>
        `;
        
        document.body.appendChild(controlsDiv);
        
        // Add hover effect to show controls
        const showControls = () => {
            controlsDiv.style.opacity = '1';
        };
        
        const hideControls = () => {
            controlsDiv.style.opacity = '0';
        };
        
        // Show controls on mouse movement
        let hideTimeout;
        document.addEventListener('mousemove', () => {
            showControls();
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(hideControls, 3000);
        });
        
        // Initial hide after 3 seconds
        hideTimeout = setTimeout(hideControls, 3000);
        
        // Add event listeners to minimal controls
        document.getElementById('fsPrevBtn').addEventListener('click', () => this.previousImage());
        document.getElementById('fsPlayPauseBtn').addEventListener('click', () => this.togglePlayPause());
        document.getElementById('fsNextBtn').addEventListener('click', () => this.nextImage());
        document.getElementById('fsExitBtn').addEventListener('click', () => this.exitFullscreen());
        
        // Update play/pause icon
        this.updateMinimalPlayPauseButton();
        
        // Re-initialize Lucide icons
        lucide.createIcons();
    }

    removeMinimalFullscreenControls() {
        const controlsDiv = document.getElementById('minimalFullscreenControls');
        if (controlsDiv) {
            controlsDiv.remove();
        }
    }

    updateMinimalPlayPauseButton() {
        const fsPlayPauseBtn = document.getElementById('fsPlayPauseBtn');
        if (fsPlayPauseBtn) {
            const icon = fsPlayPauseBtn.querySelector('i');
            if (this.isPlaying) {
                icon.setAttribute('data-lucide', 'pause');
            } else {
                icon.setAttribute('data-lucide', 'play');
            }
            lucide.createIcons();
        }
    }

    updateFullscreenButton() {
        const icon = this.elements.fullscreenBtn.querySelector('i');
        if (this.isFullscreen) {
            icon.setAttribute('data-lucide', 'minimize');
            this.elements.fullscreenBtn.innerHTML = '<i data-lucide="minimize" class="w-4 h-4"></i> Exit Fullscreen';
        } else {
            icon.setAttribute('data-lucide', 'maximize');
            this.elements.fullscreenBtn.innerHTML = '<i data-lucide="maximize" class="w-4 h-4"></i> Fullscreen';
        }
        lucide.createIcons();
    }

    // Settings modal methods
    openSettingsModal() {
        this.elements.settingsModal.classList.add('active');
        this.loadSettingsToForm();
    }

    closeSettingsModal() {
        this.elements.settingsModal.classList.remove('active');
    }

    loadSettingsToForm() {
        this.elements.transitionType.value = this.transitionType;
        this.elements.fadeDuration.value = this.fadeDuration;
        this.elements.fadeDurationValue.textContent = `${this.fadeDuration}s`;
        this.elements.kenBurnsEnabled.checked = this.kenBurnsEnabled;
        this.elements.kenBurnsType.value = this.kenBurnsType;
        this.elements.kenBurnsDuration.value = this.kenBurnsDuration;
        this.elements.kenBurnsDurationValue.textContent = `${this.kenBurnsDuration}s`;
        this.elements.kenBurnsType.disabled = !this.kenBurnsEnabled;
        this.elements.kenBurnsDuration.disabled = !this.kenBurnsEnabled;
        this.elements.startFullscreenCheckbox.checked = this.startInFullscreen;
    }

    saveSettings() {
        const settings = {
            transitionType: this.transitionType,
            fadeDuration: this.fadeDuration,
            kenBurnsEnabled: this.kenBurnsEnabled,
            kenBurnsType: this.kenBurnsType,
            kenBurnsDuration: this.kenBurnsDuration,
            startInFullscreen: this.startInFullscreen,
            slideSpeed: this.slideSpeed,
            loop: this.loop
        };
        
        localStorage.setItem('slideshowSettings', JSON.stringify(settings));
        this.updateCSSVariables();
        this.applyKenBurnsEffect();
    }

    loadSettings() {
        const stored = localStorage.getItem('slideshowSettings');
        if (stored) {
            try {
                const settings = JSON.parse(stored);
                this.transitionType = settings.transitionType || 'fade';
                this.fadeDuration = settings.fadeDuration || 0.5;
                this.kenBurnsEnabled = settings.kenBurnsEnabled || false;
                this.kenBurnsType = settings.kenBurnsType || 'zoom';
                this.kenBurnsDuration = settings.kenBurnsDuration || 10;
                this.startInFullscreen = settings.startInFullscreen || false;
                this.slideSpeed = settings.slideSpeed || 3000;
                this.loop = settings.loop !== undefined ? settings.loop : true;
                
                // Update UI elements
                this.elements.speedSlider.value = this.slideSpeed / 1000;
                this.elements.speedValue.textContent = `${this.slideSpeed / 1000}s`;
                this.elements.loopCheckbox.checked = this.loop;
                
                this.updateCSSVariables();
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        }
    }

    resetSettings() {
        this.transitionType = 'fade';
        this.fadeDuration = 0.5;
        this.kenBurnsEnabled = false;
        this.kenBurnsType = 'zoom';
        this.kenBurnsDuration = 10;
        this.startInFullscreen = false;
        
        this.loadSettingsToForm();
        this.saveSettings();
        this.applyKenBurnsEffect();
    }

    updateCSSVariables() {
        document.documentElement.style.setProperty('--fade-duration', `${this.fadeDuration}s`);
        document.documentElement.style.setProperty('--ken-burns-duration', `${this.kenBurnsDuration}s`);
    }

    // URL parameter methods
    checkURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const fullscreenParam = urlParams.get('fullscreen');
        
        if (fullscreenParam === 'true') {
            this.startInFullscreen = true;
        }
    }
}

// Initialize the slideshow when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Create slideshow instance
    window.slideshow = new PictureSlideshow();
});

// Handle visibility change to pause slideshow when tab is not visible
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.slideshow && window.slideshow.isPlaying) {
        window.slideshow.stopSlideshow();
    }
});
