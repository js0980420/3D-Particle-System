export class UI {
    constructor(particleSystem, vision) {
        this.particleSystem = particleSystem;
        this.vision = vision;

        this.init();
    }

    init() {
        // Template Selection
        const templateBtns = document.querySelectorAll('.template-btn');
        templateBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all
                templateBtns.forEach(b => b.classList.remove('active'));

                // Add to clicked (handle bubble up if icon clicked)
                const target = e.target.closest('.template-btn');
                target.classList.add('active');

                // Set template
                const template = target.getAttribute('data-template');
                this.particleSystem.setTemplate(template);
            });
        });

        // Color Picker
        const colorPicker = document.getElementById('particle-color');
        colorPicker.addEventListener('input', (e) => {
            this.particleSystem.setColor(e.target.value);
        });

        // Fullscreen
        const fsBtn = document.getElementById('fullscreen-btn');
        fsBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        });

        // Start Status Loop
        this.updateStatus();
    }

    updateStatus() {
        const handStatus = document.getElementById('hand-status');
        const pinchValue = document.getElementById('pinch-value');

        if (this.vision.isReady) {
            if (this.vision.lastResult && this.vision.lastResult.landmarks && this.vision.lastResult.landmarks.length > 0) {
                handStatus.textContent = 'Detected';
                handStatus.style.color = '#00ff00';
            } else {
                handStatus.textContent = 'Searching...';
                handStatus.style.color = '#a0a0b0';
            }

            const pinch = Math.round(this.vision.pinchDistance * 100);
            pinchValue.textContent = `${pinch}%`;
        }

        requestAnimationFrame(() => this.updateStatus());
    }

    hideLoading() {
        const loader = document.getElementById('loading');
        loader.classList.add('hidden');
    }
}
