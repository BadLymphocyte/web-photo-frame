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
        this.transitionTypes = ['fade']; // Default to fade only
        this.transitionType = 'fade'; // Current transition type
        this.randomTransitions = false; // Whether to use random transitions
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
            setTimeout(() => this.enterFullscreen(), 500);
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
            speedSliderFooter: document.querySelector('footer #speedSlider'),
            speedValueFooter: document.querySelector('footer #speedValue'),
            loopCheckboxFooter: document.querySelector('footer #loopCheckbox'),
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
            speedSliderSettings: document.getElementById('modalSpeedSlider'),
            speedValueSettings: document.getElementById('modalSpeedValue'),
            loopCheckboxSettings: document.getElementById('modalLoopCheckbox'),
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

        // Footer controls
        if (this.elements.speedSliderFooter) {
            this.elements.speedSliderFooter.addEventListener('input', (e) => {
                this.slideSpeed = e.target.value * 1000;
                this.elements.speedValueFooter.textContent = `${e.target.value}s`;
                if (this.isPlaying) {
                    this.stopSlideshow();
                    this.startSlideshow();
                }
            });
        }

        if (this.elements.loopCheckboxFooter) {
            this.elements.loopCheckboxFooter.addEventListener('change', (e) => {
                this.loop = e.target.checked;
            });
        }

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
            this.updateTransitionTypes(e.target.selectedOptions);
        });
        
        this.elements.randomTransitions = document.getElementById('randomTransitions');
        if (this.elements.randomTransitions) {
            this.elements.randomTransitions.addEventListener('change', (e) => {
                this.randomTransitions = e.target.checked;
            });
        }

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

        // Settings modal speed slider
        if (this.elements.speedSliderSettings) {
            this.elements.speedSliderSettings.addEventListener('input', (e) => {
                this.slideSpeed = e.target.value * 1000;
                this.elements.speedValueSettings.textContent = `${e.target.value}s`;
                // Also update footer slider
                if (this.elements.speedSliderFooter) {
                    this.elements.speedSliderFooter.value = e.target.value;
                    this.elements.speedValueFooter.textContent = `${e.target.value}s`;
                }
                if (this.isPlaying) {
                    this.stopSlideshow();
                    this.startSlideshow();
                }
            });
        }

        // Settings modal loop checkbox
        if (this.elements.loopCheckboxSettings) {
            this.elements.loopCheckboxSettings.addEventListener('change', (e) => {
                this.loop = e.target.checked;
                // Also update footer checkbox
                if (this.elements.loopCheckboxFooter) {
                    this.elements.loopCheckboxFooter.checked = e.target.checked;
                }
            });
        }

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
            // Don't handle if settings modal is open
            if (this.elements.settingsModal.classList.contains('active')) {
                if (e.key === 'Escape') {
                    this.closeSettingsModal();
                }
                return;
            }

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
            if (typeof JxlWasm !== 'undefined') {
                this.jxlDecoder = await JxlWasm();
            }
        } catch (error) {
            console.warn('JXL support not available:', error);
        }
    }

    async handleFileUpload(files) {
        try {
            const formData = new FormData();
            
            Array.from(files).forEach(file => {
                if (this.isImageFile(file)) {
                    formData.append('images', file);
                }
            });

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                await this.loadImagesFromServer();
                this.showNotification(result.message, 'success');
            } else {
                this.showNotification(result.error || 'Upload failed', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showNotification('Upload failed: ' + error.message, 'error');
        }
    }

    async loadImagesFromServer() {
        try {
            const response = await fetch('/api/images');
            const serverImages = await response.json();
            
            this.images = serverImages.map(img => ({
                name: img.name,
                url: `/images/${encodeURIComponent(img.name)}`,
                type: img.type,
                size: img.size
            }));
            
            this.updateUI();
            this.createThumbnails();
            
            if (this.images.length > 0) {
                if (this.currentIndex >= this.images.length || this.elements.currentImage.classList.contains('hidden')) {
                    this.currentIndex = 0;
                    this.showCurrentImage();
                }
            }
        } catch (error) {
            console.error('Error loading images from server:', error);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50 transition-all duration-300 ${
            type === 'success' ? 'bg-green-600' : 
            type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    isImageFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/jxl'];
        return validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.jxl');
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
                if (this.isTransitioning) return;
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
        if (this.images.length === 0 || this.isTransitioning) return;

        const currentImage = this.images[this.currentIndex];
        
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
            this.applyKenBurnsEffect();
        }
        
        this.elements.currentIndex.textContent = this.currentIndex + 1;
        this.elements.totalImages.textContent = this.images.length;
        
        this.updateThumbnailSelection();
    }

    previousImage() {
        if (this.images.length === 0 || this.isTransitioning) return;
        
        this.currentIndex = this.currentIndex === 0 
            ? this.loop ? this.images.length - 1 : 0
            : this.currentIndex - 1;
        
        this.showCurrentImage();
    }

    nextImage() {
        if (this.images.length === 0 || this.isTransitioning) return;
        
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
        const playIcon = this.elements.playPauseBtn?.querySelector('i');
        if (playIcon) {
            playIcon.setAttribute('data-lucide', 'pause');
            lucide.createIcons();
        }
        
        // Update both main and minimal play/pause buttons
        this.updateMinimalPlayPauseButton();
        this.updatePlayPauseButton();
        
        this.slideInterval = setInterval(() => {
            this.nextImage();
        }, this.slideSpeed);
    }

    stopSlideshow() {
        this.isPlaying = false;
        const playIcon = this.elements.playPauseBtn?.querySelector('i');
        if (playIcon) {
            playIcon.setAttribute('data-lucide', 'play');
            lucide.createIcons();
        }
        
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
            this.elements.noImagesMessage.classList.add('hidden');
            this.elements.controls.classList.remove('hidden');
            this.elements.imageCounter.classList.remove('hidden');
            
            this.elements.currentIndex.textContent = this.currentIndex + 1;
            this.elements.totalImages.textContent = this.images.length;
        }
    }

    // Transition methods - FIXED
    updateTransitionTypes(selectedOptions) {
        if (!selectedOptions) {
            this.transitionTypes = ['none'];
            this.randomTransitions = false;
        } else {
            this.transitionTypes = Array.from(selectedOptions).map(option => option.value);
            this.randomTransitions = this.randomTransitions; // Keep existing random setting
        }
        
        // If only one transition selected and it's not "none", disable random checkbox
        if (this.elements.randomTransitions) {
            this.elements.randomTransitions.disabled = this.transitionTypes.length <= 1;
        }
    }

    getRandomTransition() {
        if (this.randomTransitions && this.transitionTypes.length > 1) {
            const availableTransitions = this.transitionTypes.filter(t => t !== 'none');
            if (availableTransitions.length > 0) {
                return availableTransitions[Math.floor(Math.random() * availableTransitions.length)];
            }
        }
        return this.transitionType;
    }

    applyTransition(imageUrl) {
        const currentImg = this.elements.currentImage;
        const nextImg = this.elements.nextImage;
        
        // Remove Ken Burns effect during transition
        currentImg.classList.remove('ken-burns', 'ken-burns-pan');
        nextImg.classList.remove('ken-burns', 'ken-burns-pan');
        
        // Set up the next image
        nextImg.src = imageUrl;
        nextImg.classList.remove('hidden');
        
        // Apply transition based on type
        const transitionType = this.getRandomTransition();
        switch (transitionType) {
            case 'fade':
                this.applyFadeTransition(currentImg, nextImg);
                break;
            case 'wipe-left':
            case 'wipe-right':
            case 'wipe-up':
            case 'wipe-down':
                this.applyWipeTransition(currentImg, nextImg, this.transitionType);
                break;
            case 'cube':
                this.applyCubeTransition(currentImg, nextImg);
                break;
            default:
                this.applyDirectTransition(currentImg, nextImg);
        }
    }

    applyFadeTransition(currentImg, nextImg) {
        // Reset both images to centered position
        currentImg.style.cssText = 'opacity: 1; transition: none;';
        nextImg.style.cssText = 'opacity: 0; transition: none;';
        
        // Show next image
        nextImg.classList.remove('hidden');
        this.elements.noImagesMessage.classList.add('hidden');
        
        // Force reflow
        void nextImg.offsetHeight;
        
        // Apply transitions
        currentImg.style.transition = `opacity ${this.fadeDuration}s ease-in-out`;
        nextImg.style.transition = `opacity ${this.fadeDuration}s ease-in-out`;
        
        // Start fade
        requestAnimationFrame(() => {
            currentImg.style.opacity = '0';
            nextImg.style.opacity = '1';
        });
        
        setTimeout(() => {
            // Clean up
            currentImg.src = nextImg.src;
            currentImg.style.cssText = '';
            currentImg.classList.remove('hidden');
            
            nextImg.classList.add('hidden');
            nextImg.style.cssText = '';
            
            this.elements.controls.classList.remove('hidden');
            this.elements.imageCounter.classList.remove('hidden');
            
            this.isTransitioning = false;
            this.applyKenBurnsEffect();
        }, this.fadeDuration * 1000);
    }

    applyWipeTransition(currentImg, nextImg, direction) {
        const container = this.elements.currentImage.parentElement;
        
        // Position images absolutely within container
        currentImg.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); transition: none; width: auto; max-width: 100%; max-height: 100%; z-index: 1;';
        nextImg.style.cssText = 'position: absolute; top: 50%; left: 50%; width: auto; max-width: 100%; max-height: 100%; z-index: 2;';
        
        // Set initial position for next image based on direction
        const transforms = {
            'wipe-left': 'translate(50%, -50%)',
            'wipe-right': 'translate(-150%, -50%)',
            'wipe-up': 'translate(-50%, 50%)',
            'wipe-down': 'translate(-50%, -150%)'
        };
        
        nextImg.style.transform = transforms[direction];
        nextImg.style.transition = 'none';
        
        // Show next image
        nextImg.classList.remove('hidden');
        this.elements.noImagesMessage.classList.add('hidden');
        
        // Force reflow
        void nextImg.offsetHeight;
        
        // Apply transition
        nextImg.style.transition = `transform ${this.fadeDuration}s ease-in-out`;
        
        // Start wipe
        requestAnimationFrame(() => {
            nextImg.style.transform = 'translate(-50%, -50%)';
        });
        
        setTimeout(() => {
            // Clean up
            currentImg.src = nextImg.src;
            currentImg.style.cssText = '';
            currentImg.classList.remove('hidden');
            
            nextImg.classList.add('hidden');
            nextImg.style.cssText = '';
            
            this.elements.controls.classList.remove('hidden');
            this.elements.imageCounter.classList.remove('hidden');
            
            this.isTransitioning = false;
            this.applyKenBurnsEffect();
        }, this.fadeDuration * 1000);
    }

    applyCubeTransition(currentImg, nextImg) {
        const container = this.elements.currentImage.parentElement;
        container.style.perspective = '1000px';
        
        // Setup 3D space
        currentImg.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotateY(0deg); transform-style: preserve-3d; transition: none; width: auto; max-width: 100%; max-height: 100%; z-index: 1;';
        nextImg.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotateY(-90deg); transform-style: preserve-3d; transition: none; width: auto; max-width: 100%; max-height: 100%; z-index: 2;';
        
        // Show next image
        nextImg.classList.remove('hidden');
        this.elements.noImagesMessage.classList.add('hidden');
        
        // Force reflow
        void nextImg.offsetHeight;
        
        // Apply transitions
        currentImg.style.transition = `transform ${this.fadeDuration}s ease-in-out`;
        nextImg.style.transition = `transform ${this.fadeDuration}s ease-in-out`;
        
        // Start rotation
        requestAnimationFrame(() => {
            currentImg.style.transform = 'translate(-50%, -50%) rotateY(90deg)';
            nextImg.style.transform = 'translate(-50%, -50%) rotateY(0deg)';
        });
        
        setTimeout(() => {
            // Clean up
            currentImg.src = nextImg.src;
            currentImg.style.cssText = '';
            currentImg.classList.remove('hidden');
            
            nextImg.classList.add('hidden');
            nextImg.style.cssText = '';
            
            container.style.perspective = '';
            
            this.elements.controls.classList.remove('hidden');
            this.elements.imageCounter.classList.remove('hidden');
            
            this.isTransitioning = false;
            this.applyKenBurnsEffect();
        }, this.fadeDuration * 1000);
    }

    applyDirectTransition(currentImg, nextImg) {
        currentImg.src = nextImg.src;
        nextImg.classList.add('hidden');
        this.isTransitioning = false;
        this.applyKenBurnsEffect();
    }

    // Ken Burns effect methods
    applyKenBurnsEffect() {
        const currentImg = this.elements.currentImage;
        
        currentImg.classList.remove('ken-burns', 'ken-burns-pan');
        
        if (this.kenBurnsEnabled && !currentImg.classList.contains('hidden') && !this.isTransitioning) {
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
        
        this.hideUIForFullscreen();
        this.centerFullscreenImage();
    }

    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        
        this.showUIForFullscreen();
    }

    centerFullscreenImage() {
        const currentImg = this.elements.currentImage;
        const nextImg = this.elements.nextImage;
        
        // Center both images in fullscreen
        currentImg.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); max-width: 100vw; max-height: 100vh; object-fit: contain;';
        nextImg.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); max-width: 100vw; max-height: 100vh; object-fit: contain;';
    }

    hideUIForFullscreen() {
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
        
        const imageContainer = document.getElementById('imageContainer');
        const mainSection = document.querySelector('main section');
        
        if (imageContainer) {
            imageContainer.style.cssText = 'height: 100vh; width: 100vw; margin: 0; padding: 0; border-radius: 0; background: black; display: flex; align-items: center; justify-content: center;';
        }
        
        if (mainSection) {
            mainSection.style.cssText = 'margin: 0; padding: 0; border-radius: 0; background: black; height: 100vh;';
        }
        
        this.createMinimalFullscreenControls();
    }

    showUIForFullscreen() {
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
        
        const imageContainer = document.getElementById('imageContainer');
        const mainSection = document.querySelector('main section');
        
        if (imageContainer) {
            imageContainer.style.cssText = '';
        }
        
        if (mainSection) {
            mainSection.style.cssText = '';
        }
        
        this.removeMinimalFullscreenControls();
    }

    createMinimalFullscreenControls() {
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
        
        let hideTimeout;
        const showControls = () => {
            controlsDiv.style.opacity = '1';
        };
        
        const hideControls = () => {
            controlsDiv.style.opacity = '0';
        };
        
        document.addEventListener('mousemove', () => {
            showControls();
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(hideControls, 3000);
        });
        
        hideTimeout = setTimeout(hideControls, 3000);
        
        document.getElementById('fsPrevBtn').addEventListener('click', () => this.previousImage());
        document.getElementById('fsPlayPauseBtn').addEventListener('click', () => this.togglePlayPause());
        document.getElementById('fsNextBtn').addEventListener('click', () => this.nextImage());
        document.getElementById('fsExitBtn').addEventListener('click', () => this.exitFullscreen());
        
        this.updateMinimalPlayPauseButton();
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
            if (icon) {
                icon.setAttribute('data-lucide', this.isPlaying ? 'pause' : 'play');
                lucide.createIcons();
            }
        }
    }

    updateFullscreenButton() {
        if (!this.elements.fullscreenBtn) return;
        
        const icon = this.elements.fullscreenBtn.querySelector('i');
        if (this.isFullscreen) {
            if (icon) icon.setAttribute('data-lucide', 'minimize');
            this.elements.fullscreenBtn.innerHTML = '<i data-lucide="minimize"></i> Exit Fullscreen';
        } else {
            if (icon) icon.setAttribute('data-lucide', 'maximize');
            this.elements.fullscreenBtn.innerHTML = '<i data-lucide="maximize"></i> Fullscreen';
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
        // Clear existing options but preserve them for multiple select
        const existingOptions = Array.from(this.elements.transitionType.options || []);
        
        // Set options based on current transition types
        this.transitionTypes.forEach(type => {
            const existingOption = existingOptions.find(opt => opt.value === type);
            if (existingOption) {
                existingOption.selected = true;
            } else {
                const option = document.createElement('option');
                option.value = type;
                option.selected = this.transitionTypes.includes(type);
                option.textContent = this.getTransitionDisplayName(type);
                this.elements.transitionType.add(option);
            }
        });
        
        this.elements.randomTransitions.checked = this.randomTransitions;
        this.elements.fadeDuration.value = this.fadeDuration;
        this.elements.fadeDurationValue.textContent = `${this.fadeDuration}s`;
        this.elements.kenBurnsEnabled.checked = this.kenBurnsEnabled;
        this.elements.kenBurnsType.disabled = !this.kenBurnsEnabled;
        this.elements.kenBurnsDuration.value = this.kenBurnsDuration;
        this.elements.kenBurnsDurationValue.textContent = `${this.kenBurnsDuration}s`;
        this.elements.kenBurnsDuration.disabled = !this.kenBurnsEnabled;
        this.elements.startFullscreenCheckbox.checked = this.startInFullscreen;
        
        // Update settings modal sliders
        if (this.elements.speedSliderSettings) {
            this.elements.speedSliderSettings.value = this.slideSpeed / 1000;
            this.elements.speedValueSettings.textContent = `${this.slideSpeed / 1000}s`;
        }
        if (this.elements.loopCheckboxSettings) {
            this.elements.loopCheckboxSettings.checked = this.loop;
        }
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
        this.showNotification('Settings saved', 'success');
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
                
                // Update all UI elements
                if (this.elements.speedSliderFooter) {
                    this.elements.speedSliderFooter.value = this.slideSpeed / 1000;
                    this.elements.speedValueFooter.textContent = `${this.slideSpeed / 1000}s`;
                }
                if (this.elements.loopCheckboxFooter) {
                    this.elements.loopCheckboxFooter.checked = this.loop;
                }
                
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
        this.slideSpeed = 3000;
        this.loop = true;
        
        this.loadSettingsToForm();
        this.saveSettings();
        this.applyKenBurnsEffect();
        
        // Update footer elements
        if (this.elements.speedSliderFooter) {
            this.elements.speedSliderFooter.value = 3;
            this.elements.speedValueFooter.textContent = '3s';
        }
        if (this.elements.loopCheckboxFooter) {
            this.elements.loopCheckboxFooter.checked = true;
        }
    }

    updateCSSVariables() {
        document.documentElement.style.setProperty('--fade-duration', `${this.fadeDuration}s`);
        document.documentElement.style.setProperty('--ken-burns-duration', `${this.kenBurnsDuration}s`);
    }

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
    lucide.createIcons();
    window.slideshow = new PictureSlideshow();
});

// Handle visibility change to pause slideshow when tab is not visible
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.slideshow && window.slideshow.isPlaying) {
        window.slideshow.stopSlideshow();
    }
});