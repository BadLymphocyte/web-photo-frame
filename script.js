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
        this.fadeDuration = 0.5;
        this.isFullscreen = false;
        this.startInFullscreen = false;
        this.isTransitioning = false;
        this.randomOrder = false; // Display images in random order
        this.previousRandomIndex = -1; // Track last random image to avoid repeats
        
        // Check URL parameters
        this.checkURLParameters();
        
        this.initializeElements();
        this.attachEventListeners();
        this.initializeJXL();
        this.loadSettings();
        this.loadImagesFromServer();
        
        // Start in fullscreen if requested
        if (this.startInFullscreen) {
            setTimeout(() => this.enterFullscreen(), 500);
        }
    }

    initializeElements() {
        this.elements = {
            currentImage: document.getElementById('currentImage'),
            nextImage: document.getElementById('nextImage'),
            noImagesMessage: document.getElementById('noImagesMessage'),
            controls: document.getElementById('controls'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            playPauseBtn: document.getElementById('playPauseBtn'),
            thumbnailContainer: document.getElementById('thumbnailContainer'),
            speedInputFooter: document.querySelector('footer #speedInput'),
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
            fadeDuration: document.getElementById('fadeDuration'),
            fadeDurationValue: document.getElementById('fadeDurationValue'),
            speedInputSettings: document.getElementById('modalSpeedInput'),
            loopCheckboxSettings: document.getElementById('modalLoopCheckbox'),
            startFullscreenCheckbox: document.getElementById('startFullscreenCheckbox'),
            randomOrderCheckbox: document.getElementById('randomOrderCheckbox'),
            saveSettingsBtn: document.getElementById('saveSettingsBtn'),
            resetSettingsBtn: document.getElementById('resetSettingsBtn'),
            // Fullscreen
            fullscreenBtn: document.getElementById('fullscreenBtn')
        };
    }

    attachEventListeners() {
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
        if (this.elements.speedInputFooter) {
            this.elements.speedInputFooter.addEventListener('change', (e) => {
                let value = parseInt(e.target.value);
                if (isNaN(value) || value < 3) {
                    value = 3;
                } else if (value > 600) {
                    value = 600;
                }
                e.target.value = value;
                this.slideSpeed = value * 1000;
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

        this.elements.speedInputSettings.addEventListener('change', (e) => {
            let value = parseInt(e.target.value);
            if (isNaN(value) || value < 3) {
                value = 3;
            } else if (value > 600) {
                value = 600;
            }
            e.target.value = value;
            this.slideSpeed = value * 1000;
            // Also update footer input
            if (this.elements.speedInputFooter) {
                this.elements.speedInputFooter.value = value;
            }
            if (this.isPlaying) {
                this.stopSlideshow();
                this.startSlideshow();
            }
        });

        this.elements.loopCheckboxSettings.addEventListener('change', (e) => {
            this.loop = e.target.checked;
            // Also update footer checkbox
            if (this.elements.loopCheckboxFooter) {
                this.elements.loopCheckboxFooter.checked = e.target.checked;
            }
        });

        this.elements.startFullscreenCheckbox.addEventListener('change', (e) => {
            this.startInFullscreen = e.target.checked;
        });

        this.elements.randomOrderCheckbox.addEventListener('change', (e) => {
            this.randomOrder = e.target.checked;
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

        // Auto-hide controls on main screen
        this.setupAutoHideControls();
    }

    async initializeJXL() {
        // Simple fallback - JXL files will be handled by server or browser if supported
        // For now, we'll just pass them through as regular images
        this.jxlDecoder = null;
        console.info('JXL files will be served directly - browser native support required');
    }

    async loadImagesFromServer() {
        try {
            const response = await fetch('/api/images');
            const serverImages = await response.json();
            
            this.images = serverImages.map(img => ({
                name: img.name,
                url: `/images/${encodeURIComponent(img.path)}`,
                path: img.path,
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
        
        // For large libraries, only render visible thumbnails
        if (this.images.length > 100) {
            this.elements.thumbnailContainer.innerHTML = `<p class="text-gray-400 text-sm">${this.images.length} images loaded. Thumbnails hidden for performance.</p>`;
            return;
        }
        
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
        if (this.images.length > 100) return; // Skip for large libraries
        
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
        if (!currentImage) {
            console.error('Invalid image index:', this.currentIndex);
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
    }

    previousImage() {
        if (this.images.length === 0 || this.isTransitioning) return;
        
        if (this.randomOrder) {
            // Prevent showing the same image twice in a row
            let newIndex;
            if (this.images.length === 1) {
                newIndex = 0;
            } else {
                do {
                    newIndex = Math.floor(Math.random() * this.images.length);
                } while (newIndex === this.previousRandomIndex);
                this.previousRandomIndex = newIndex;
            }
            this.currentIndex = newIndex;
        } else {
            this.currentIndex = this.currentIndex === 0 
                ? this.loop ? this.images.length - 1 : 0
                : this.currentIndex - 1;
        }
        
        this.showCurrentImage();
    }

    nextImage() {
        if (this.images.length === 0 || this.isTransitioning) return;
        
        if (this.randomOrder) {
            // Prevent showing the same image twice in a row
            let newIndex;
            if (this.images.length === 1) {
                newIndex = 0;
            } else {
                do {
                    newIndex = Math.floor(Math.random() * this.images.length);
                } while (newIndex === this.previousRandomIndex);
                this.previousRandomIndex = newIndex;
            }
            this.currentIndex = newIndex;
        } else {
            this.currentIndex = this.currentIndex === this.images.length - 1 
                ? this.loop ? 0 : this.images.length - 1
                : this.currentIndex + 1;
        }
        
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

    setupAutoHideControls() {
        let hideTimeout;
        const imageContainer = document.getElementById('imageContainer');
        const controls = this.elements.controls;
        
        const showControls = () => {
            if (controls && !this.isFullscreen) {
                controls.style.opacity = '1';
                controls.style.pointerEvents = 'auto';
            }
        };
        
        const hideControls = () => {
            if (controls && !this.isFullscreen) {
                controls.style.opacity = '0';
                controls.style.pointerEvents = 'none';
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
        
        // Keep controls visible when mouse is over them
        if (controls) {
            controls.addEventListener('mouseenter', () => {
                showControls();
                clearTimeout(hideTimeout);
            });
            
            controls.addEventListener('mouseleave', () => {
                clearTimeout(hideTimeout);
                hideTimeout = setTimeout(hideControls, 1000);
            });
        }
        
        // Initially hide controls after 3 seconds
        setTimeout(hideControls, 3000);
    }

    applyTransition(imageUrl) {
        const transition = this.transitionTypes.length > 1 
            ? this.transitionTypes[Math.floor(Math.random() * this.transitionTypes.length)]
            : this.transitionTypes[0];
        
        this.executeTransition(imageUrl, transition);
    }

    executeTransition(imageUrl, type) {
        const current = this.elements.currentImage;
        const next = this.elements.nextImage;
        
        // Add error handling for image loading
        next.onerror = () => {
            console.error('Failed to load image:', imageUrl);
            this.showNotification('Failed to load image', 'error');
            this.isTransitioning = false;
        };
        
        next.src = imageUrl;
        next.classList.remove('hidden');
        
        const transitions = {
            'fade': () => this.transitionFade(current, next),
            'dissolve': () => this.transitionDissolve(current, next),
            'zoom-in': () => this.transitionZoomIn(current, next),
            'zoom-out': () => this.transitionZoomOut(current, next),
            'blur': () => this.transitionBlur(current, next),
            'slide': () => this.transitionSlide(current, next),
            'wipe-left': () => this.transitionWipe(current, next, 'left'),
            'wipe-right': () => this.transitionWipe(current, next, 'right'),
            'wipe-up': () => this.transitionWipe(current, next, 'up'),
            'wipe-down': () => this.transitionWipe(current, next, 'down'),
            'cube': () => this.transitionCube(current, next)
        };
        
        const transitionFn = transitions[type] || (() => this.transitionNone(current, next));
        transitionFn();
    }

    transitionFade(current, next) {
        current.style.opacity = '1';
        next.style.opacity = '0';
        
        requestAnimationFrame(() => {
            current.style.transition = `opacity ${this.fadeDuration}s ease-in-out`;
            next.style.transition = `opacity ${this.fadeDuration}s ease-in-out`;
            current.style.opacity = '0';
            next.style.opacity = '1';
        });
        
        setTimeout(() => this.completeTransition(current, next), this.fadeDuration * 1000);
    }

    transitionDissolve(current, next) {
        // Crossfade effect - both images visible during transition
        current.style.opacity = '1';
        next.style.opacity = '0';
        next.style.zIndex = '2';
        current.style.zIndex = '1';
        
        requestAnimationFrame(() => {
            next.style.transition = `opacity ${this.fadeDuration}s ease-in-out`;
            next.style.opacity = '1';
        });
        
        setTimeout(() => {
            current.style.zIndex = '';
            next.style.zIndex = '';
            this.completeTransition(current, next);
        }, this.fadeDuration * 1000);
    }

    transitionZoomIn(current, next) {
        // Next image starts small and scales up
        current.style.opacity = '1';
        next.style.opacity = '0';
        next.style.transform = 'translate(-50%, -50%) scale(0.5)';
        
        requestAnimationFrame(() => {
            current.style.transition = `opacity ${this.fadeDuration}s ease-in-out`;
            next.style.transition = `opacity ${this.fadeDuration}s ease-in-out, transform ${this.fadeDuration}s ease-in-out`;
            current.style.opacity = '0';
            next.style.opacity = '1';
            next.style.transform = 'translate(-50%, -50%) scale(1)';
        });
        
        setTimeout(() => this.completeTransition(current, next), this.fadeDuration * 1000);
    }

    transitionZoomOut(current, next) {
        // Current image scales up and fades, next image appears underneath
        current.style.opacity = '1';
        current.style.transform = 'translate(-50%, -50%) scale(1)';
        current.style.zIndex = '2';
        next.style.opacity = '1';
        next.style.zIndex = '1';
        
        requestAnimationFrame(() => {
            current.style.transition = `opacity ${this.fadeDuration}s ease-in-out, transform ${this.fadeDuration}s ease-in-out`;
            current.style.opacity = '0';
            current.style.transform = 'translate(-50%, -50%) scale(1.5)';
        });
        
        setTimeout(() => {
            current.style.zIndex = '';
            next.style.zIndex = '';
            this.completeTransition(current, next);
        }, this.fadeDuration * 1000);
    }

    transitionBlur(current, next) {
        // Current image blurs out while next image blurs in
        current.style.opacity = '1';
        current.style.filter = 'blur(0px)';
        next.style.opacity = '0';
        next.style.filter = 'blur(20px)';
        
        requestAnimationFrame(() => {
            current.style.transition = `opacity ${this.fadeDuration}s ease-in-out, filter ${this.fadeDuration}s ease-in-out`;
            next.style.transition = `opacity ${this.fadeDuration}s ease-in-out, filter ${this.fadeDuration}s ease-in-out`;
            current.style.opacity = '0';
            current.style.filter = 'blur(20px)';
            next.style.opacity = '1';
            next.style.filter = 'blur(0px)';
        });
        
        setTimeout(() => this.completeTransition(current, next), this.fadeDuration * 1000);
    }

    transitionSlide(current, next) {
        // Next image pushes current image out to the left
        current.style.transform = 'translate(-50%, -50%)';
        next.style.transform = 'translate(-50%, -50%) translateX(100%)';
        
        requestAnimationFrame(() => {
            current.style.transition = `transform ${this.fadeDuration}s ease-in-out`;
            next.style.transition = `transform ${this.fadeDuration}s ease-in-out`;
            current.style.transform = 'translate(-50%, -50%) translateX(-100%)';
            next.style.transform = 'translate(-50%, -50%)';
        });
        
        setTimeout(() => this.completeTransition(current, next), this.fadeDuration * 1000);
    }

    transitionWipe(current, next, direction) {
        const offsets = {
            'left': 'translate(-50%, -50%) translateX(100%)',
            'right': 'translate(-50%, -50%) translateX(-100%)',
            'up': 'translate(-50%, -50%) translateY(100%)',
            'down': 'translate(-50%, -50%) translateY(-100%)'
        };
        
        next.style.transform = offsets[direction];
        
        requestAnimationFrame(() => {
            next.style.transition = `transform ${this.fadeDuration}s ease-in-out`;
            next.style.transform = 'translate(-50%, -50%)';
        });
        
        setTimeout(() => this.completeTransition(current, next), this.fadeDuration * 1000);
    }

    transitionCube(current, next) {
        const container = current.parentElement;
        container.style.perspective = '1000px';
        
        current.style.transformStyle = 'preserve-3d';
        next.style.transformStyle = 'preserve-3d';
        current.style.transform = 'translate(-50%, -50%) rotateY(0deg)';
        next.style.transform = 'translate(-50%, -50%) rotateY(-90deg)';
        
        requestAnimationFrame(() => {
            current.style.transition = `transform ${this.fadeDuration}s ease-in-out`;
            next.style.transition = `transform ${this.fadeDuration}s ease-in-out`;
            current.style.transform = 'translate(-50%, -50%) rotateY(90deg)';
            next.style.transform = 'translate(-50%, -50%) rotateY(0deg)';
        });
        
        setTimeout(() => {
            container.style.perspective = '';
            this.completeTransition(current, next);
        }, this.fadeDuration * 1000);
    }

    transitionNone(current, next) {
        this.completeTransition(current, next);
    }

    completeTransition(current, next) {
        try {
            current.src = next.src;
            current.style.cssText = '';
            current.classList.remove('hidden');
            next.classList.add('hidden');
            next.style.cssText = '';
            next.onerror = null; // Clean up error handler
            this.isTransitioning = false;
        } catch (error) {
            console.error('Transition completion error:', error);
            this.isTransitioning = false;
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
            // Hide all UI elements with null checks
            const header = document.querySelector('header');
            const footer = document.querySelector('footer');
            const aside = document.querySelector('aside');
            const main = document.querySelector('main');
            
            if (header) header.style.display = 'none';
            if (footer) footer.style.display = 'none';
            if (aside) aside.style.display = 'none';
            if (main) main.style.cssText = 'margin: 0; padding: 0;';
            
            // Make image container fill screen and center content
            const container = document.getElementById('imageContainer');
            container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: black; display: flex; align-items: center; justify-content: center; margin: 0; padding: 0;';
            
            // Show controls and set up fullscreen auto-hide
            if (this.elements.controls) {
                this.elements.controls.style.display = '';
                this.setupFullscreenAutoHide();
            }
            
            // Update button
            const btn = this.elements.fullscreenBtn;
            if (btn) {
                btn.innerHTML = '<i data-lucide="minimize"></i> Exit Fullscreen';
                lucide.createIcons();
            }
        } else {
            // Restore all UI elements with null checks
            const header = document.querySelector('header');
            const footer = document.querySelector('footer');
            const aside = document.querySelector('aside');
            const main = document.querySelector('main');
            
            if (header) header.style.display = '';
            if (footer) footer.style.display = '';
            if (aside) aside.style.display = '';
            if (main) main.style.cssText = '';
            
            // Reset image container
            const container = document.getElementById('imageContainer');
            container.style.cssText = '';
            
            // Clean up fullscreen auto-hide
            this.cleanupFullscreenAutoHide();
            
            // Update button
            const btn = this.elements.fullscreenBtn;
            if (btn) {
                btn.innerHTML = '<i data-lucide="maximize"></i> Fullscreen';
                lucide.createIcons();
            }
        }
    }

    setupFullscreenAutoHide() {
        const controls = this.elements.controls;
        const imageContainer = document.getElementById('imageContainer');
        
        const showControls = () => {
            if (controls) {
                controls.style.opacity = '1';
                controls.style.pointerEvents = 'auto';
            }
        };
        
        const hideControls = () => {
            if (controls) {
                controls.style.opacity = '0';
                controls.style.pointerEvents = 'none';
            }
        };
        
        // Store timeout reference
        let hideTimeout;
        
        // Mouse move handler
        const mouseMoveHandler = () => {
            showControls();
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(hideControls, 3000);
        };
        
        // Mouse leave handler
        const mouseLeaveHandler = () => {
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(hideControls, 1000);
        };
        
        // Keep controls visible when hovering over them
        const controlsEnterHandler = () => {
            showControls();
            clearTimeout(hideTimeout);
        };
        
        const controlsLeaveHandler = () => {
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(hideControls, 1000);
        };
        
        // Add event listeners
        if (imageContainer) {
            imageContainer.addEventListener('mousemove', mouseMoveHandler);
            imageContainer.addEventListener('mouseleave', mouseLeaveHandler);
        }
        
        if (controls) {
            controls.addEventListener('mouseenter', controlsEnterHandler);
            controls.addEventListener('mouseleave', controlsLeaveHandler);
        }
        
        // Store handlers for cleanup
        this.fullscreenHandlers = {
            mouseMoveHandler,
            mouseLeaveHandler,
            controlsEnterHandler,
            controlsLeaveHandler,
            hideTimeout
        };
        
        // Initially hide after 3 seconds
        hideTimeout = setTimeout(hideControls, 3000);
    }

    cleanupFullscreenAutoHide() {
        if (!this.fullscreenHandlers) return;
        
        const imageContainer = document.getElementById('imageContainer');
        const controls = this.elements.controls;
        
        // Remove event listeners
        if (imageContainer) {
            imageContainer.removeEventListener('mousemove', this.fullscreenHandlers.mouseMoveHandler);
            imageContainer.removeEventListener('mouseleave', this.fullscreenHandlers.mouseLeaveHandler);
        }
        
        if (controls) {
            controls.removeEventListener('mouseenter', this.fullscreenHandlers.controlsEnterHandler);
            controls.removeEventListener('mouseleave', this.fullscreenHandlers.controlsLeaveHandler);
            
            // Reset controls visibility
            controls.style.opacity = '';
            controls.style.pointerEvents = '';
        }
        
        // Clear timeout
        if (this.fullscreenHandlers.hideTimeout) {
            clearTimeout(this.fullscreenHandlers.hideTimeout);
        }
        
        this.fullscreenHandlers = null;
    }

    // Settings modal methods - Clean implementation
    openSettingsModal() {
        this.elements.settingsModal.classList.add('active');
        this.syncSettingsToForm();
    }

    closeSettingsModal() {
        this.elements.settingsModal.classList.remove('active');
    }

    syncSettingsToForm() {
        this.elements.transitionCheckboxes.forEach(cb => {
            cb.checked = this.transitionTypes.includes(cb.value);
        });
        
        this.elements.fadeDuration.value = this.fadeDuration;
        this.elements.fadeDurationValue.textContent = `${this.fadeDuration}s`;
        this.elements.startFullscreenCheckbox.checked = this.startInFullscreen;
        this.elements.randomOrderCheckbox.checked = this.randomOrder;
        
        if (this.elements.speedInputSettings) {
            this.elements.speedInputSettings.value = this.slideSpeed / 1000;
        }
        if (this.elements.speedInputFooter) {
            this.elements.speedInputFooter.value = this.slideSpeed / 1000;
        }
        if (this.elements.loopCheckboxSettings) {
            this.elements.loopCheckboxSettings.checked = this.loop;
        }
    }

    saveSettings() {
        const settings = {
            transitionTypes: this.transitionTypes,
            transitionType: this.transitionType,
            fadeDuration: this.fadeDuration,
            startInFullscreen: this.startInFullscreen,
            slideSpeed: this.slideSpeed,
            loop: this.loop,
            randomOrder: this.randomOrder
        };
        
        localStorage.setItem('slideshowSettings', JSON.stringify(settings));
        this.updateCSSVariables();
        this.showNotification('Settings saved', 'success');
    }

    loadSettings() {
        const stored = localStorage.getItem('slideshowSettings');
        if (!stored) return;
        
        try {
            const s = JSON.parse(stored);
            this.transitionTypes = s.transitionTypes || ['fade'];
            this.transitionType = s.transitionType || 'fade';
            this.fadeDuration = s.fadeDuration || 0.5;
            this.startInFullscreen = s.startInFullscreen || false;
            this.slideSpeed = s.slideSpeed || 3000;
            this.loop = s.loop !== undefined ? s.loop : true;
            this.randomOrder = s.randomOrder || false;
            
            if (this.elements.speedInputFooter) {
                this.elements.speedInputFooter.value = this.slideSpeed / 1000;
            }
            if (this.elements.loopCheckboxFooter) {
                this.elements.loopCheckboxFooter.checked = this.loop;
            }
            
            this.updateCSSVariables();
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    resetSettings() {
        this.transitionTypes = ['fade'];
        this.transitionType = 'fade';
        this.fadeDuration = 0.5;
        this.startInFullscreen = false;
        this.slideSpeed = 3000;
        this.loop = true;
        this.randomOrder = false;
        
        this.syncSettingsToForm();
        this.saveSettings();
        
        if (this.elements.speedInputFooter) {
            this.elements.speedInputFooter.value = 3;
        }
        if (this.elements.loopCheckboxFooter) {
            this.elements.loopCheckboxFooter.checked = true;
        }
    }

    updateCSSVariables() {
        document.documentElement.style.setProperty('--fade-duration', `${this.fadeDuration}s`);
    }

    checkURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('fullscreen') === 'true') {
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