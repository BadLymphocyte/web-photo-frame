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
        this.transitionTypes = ['fade']; // Array for multiple transition selection
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
            transitionCheckboxes: document.querySelectorAll('.transition-checkbox'),
            randomTransitions: document.getElementById('randomTransitions'),
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

        this.elements.transitionCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateTransitionTypes();
            });
        });

        // Select All Transitions button
        const selectAllBtn = document.getElementById('selectAllTransitions');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                this.elements.transitionCheckboxes.forEach(checkbox => {
                    checkbox.checked = true;
                });
                this.updateTransitionTypes();
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

        // Fullscreen change event listener - support all browsers
        document.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
        document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange.bind(this));
        document.addEventListener('mozfullscreenchange', this.handleFullscreenChange.bind(this));
        document.addEventListener('MSFullscreenChange', this.handleFullscreenChange.bind(this));

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

        // Auto-hide controls on main screen
        this.setupAutoHideControls();
    }

    async initializeJXL() {
        // Simple fallback - JXL files will be handled by server or browser if supported
        // For now, we'll just pass them through as regular images
        this.jxlDecoder = null;
        console.info('JXL files will be served directly - browser native support required');
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
        const isJXL = file.name.toLowerCase().endsWith('.jxl') || file.type === 'image/jxl';
        
        return validTypes.includes(file.type) || isJXL;
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
        this.updatePlayPauseButton();
        
        this.slideInterval = setInterval(() => {
            this.nextImage();
        }, this.slideSpeed);
    }

    stopSlideshow() {
        this.isPlaying = false;
        this.updatePlayPauseButton();
        
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
            this.slideInterval = null;
        }
    }

    updatePlayPauseButton() {
        const btn = this.elements.playPauseBtn;
        if (!btn) return;
        
        // Clear the button and recreate the icon
        btn.innerHTML = `<i data-lucide="${this.isPlaying ? 'pause' : 'play'}" class="w-6 h-6"></i>`;
        lucide.createIcons();
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

    // Helper methods for transition management
    updateTransitionTypes() {
        const checkedBoxes = Array.from(this.elements.transitionCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        
        if (checkedBoxes.length > 0) {
            this.transitionTypes = checkedBoxes;
            // Set current transition to first selected if current is not in list
            if (!this.transitionTypes.includes(this.transitionType)) {
                this.transitionType = this.transitionTypes[0];
            }
        } else {
            // If nothing selected, default to 'none'
            this.transitionTypes = ['none'];
            this.transitionType = 'none';
        }
    }

    getRandomTransition() {
        if (this.transitionTypes.length === 1) {
            return this.transitionTypes[0];
        }
        const randomIndex = Math.floor(Math.random() * this.transitionTypes.length);
        return this.transitionTypes[randomIndex];
    }

    setupAutoHideControls() {
        let hideTimeout;
        const imageContainer = document.getElementById('imageContainer');
        
        const showControls = () => {
            if (this.elements.controls && !this.isFullscreen) {
                this.elements.controls.style.opacity = '1';
                this.elements.controls.style.pointerEvents = 'auto';
            }
        };
        
        const hideControls = () => {
            if (this.elements.controls && !this.isFullscreen) {
                this.elements.controls.style.opacity = '0';
                this.elements.controls.style.pointerEvents = 'none';
            }
        };
        
        // Show controls on mouse movement over image container
        if (imageContainer) {
            imageContainer.addEventListener('mousemove', () => {
                showControls();
                clearTimeout(hideTimeout);
                hideTimeout = setTimeout(hideControls, 3000);
            });
            
            imageContainer.addEventListener('mouseleave', () => {
                clearTimeout(hideTimeout);
                hideTimeout = setTimeout(hideControls, 1000);
            });
        }
        
        // Initially hide controls after 3 seconds
        setTimeout(hideControls, 3000);
    }

    // Transition methods - FIXED
    applyTransition(imageUrl) {
        const currentImg = this.elements.currentImage;
        const nextImg = this.elements.nextImage;
        
        // Remove Ken Burns effect during transition
        currentImg.classList.remove('ken-burns', 'ken-burns-pan');
        nextImg.classList.remove('ken-burns', 'ken-burns-pan');
        
        // Set up the next image
        nextImg.src = imageUrl;
        nextImg.classList.remove('hidden');
        
        // Get transition type (random if multiple selected)
        const transitionType = this.transitionTypes.length > 1 
            ? this.getRandomTransition() 
            : this.transitionType;
        
        // Apply transition based on type
        switch (transitionType) {
            case 'fade':
                this.applyFadeTransition(currentImg, nextImg);
                break;
            case 'wipe-left':
            case 'wipe-right':
            case 'wipe-up':
            case 'wipe-down':
                this.applyWipeTransition(currentImg, nextImg, transitionType);
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

    // Fullscreen methods - Simple implementation
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
    }

    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    handleFullscreenChange() {
        const isFullscreen = !!(document.fullscreenElement || 
                               document.webkitFullscreenElement || 
                               document.mozFullScreenElement ||
                               document.msFullscreenElement);
        
        this.isFullscreen = isFullscreen;
        
        if (isFullscreen) {
            // Hide all UI elements
            document.querySelector('header').style.display = 'none';
            document.querySelector('footer').style.display = 'none';
            document.querySelector('aside').style.display = 'none';
            document.querySelector('main').style.cssText = 'margin: 0; padding: 0;';
            
            // Make image container fill screen and center content
            const container = document.getElementById('imageContainer');
            container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: black; display: flex; align-items: center; justify-content: center; margin: 0; padding: 0;';
            
            // Update button
            const btn = this.elements.fullscreenBtn;
            if (btn) {
                btn.innerHTML = '<i data-lucide="minimize"></i> Exit Fullscreen';
                lucide.createIcons();
            }
        } else {
            // Restore all UI elements
            document.querySelector('header').style.display = '';
            document.querySelector('footer').style.display = '';
            document.querySelector('aside').style.display = '';
            document.querySelector('main').style.cssText = '';
            
            // Reset image container
            const container = document.getElementById('imageContainer');
            container.style.cssText = '';
            
            // Update button
            const btn = this.elements.fullscreenBtn;
            if (btn) {
                btn.innerHTML = '<i data-lucide="maximize"></i> Fullscreen';
                lucide.createIcons();
            }
        }
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
        // Update transition checkboxes
        this.elements.transitionCheckboxes.forEach(checkbox => {
            checkbox.checked = this.transitionTypes.includes(checkbox.value);
        });
        
        this.elements.fadeDuration.value = this.fadeDuration;
        this.elements.fadeDurationValue.textContent = `${this.fadeDuration}s`;
        this.elements.kenBurnsEnabled.checked = this.kenBurnsEnabled;
        this.elements.kenBurnsType.value = this.kenBurnsType;
        this.elements.kenBurnsDuration.value = this.kenBurnsDuration;
        this.elements.kenBurnsDurationValue.textContent = `${this.kenBurnsDuration}s`;
        this.elements.kenBurnsType.disabled = !this.kenBurnsEnabled;
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
            transitionTypes: this.transitionTypes,
            transitionType: this.transitionType,
            randomTransitions: this.randomTransitions,
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
                this.transitionTypes = settings.transitionTypes || ['fade'];
                this.transitionType = settings.transitionType || 'fade';
                this.randomTransitions = settings.randomTransitions || false;
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
        this.transitionTypes = ['fade'];
        this.transitionType = 'fade';
        this.randomTransitions = false;
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