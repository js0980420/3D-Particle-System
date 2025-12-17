import * as THREE from 'three';
import { Vision } from './vision.js';
import { ParticleSystem } from './particles.js';
import { UI } from './ui.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

class App {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.particleSystem = null;
        this.vision = null;
        this.ui = null;

        this.container = document.body;

        this.init();
    }

    async init() {
        // 1. Setup Three.js
        this.scene = new THREE.Scene();
        // Fog for depth
        this.scene.fog = new THREE.FogExp2(0x000000, 0.05);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 20;

        // Antialias false is better for performance when using post-processing
        this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.container.appendChild(this.renderer.domElement);

        // Post-processing
        const renderScene = new RenderPass(this.scene, this.camera);

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = 0;
        bloomPass.strength = 1.5; // Intensity
        bloomPass.radius = 0.5;

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(bloomPass);

        // 2. Setup Particles
        this.particleSystem = new ParticleSystem(this.scene);

        // 3. Setup Vision
        this.vision = new Vision();

        // 4. Setup UI
        this.ui = new UI(this.particleSystem, this.vision);

        // Handle Resize
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Start Animation Loop
        this.animate();

        // 5. Initialize Vision (Async)
        try {
            await this.vision.init();
            this.ui.hideLoading();
            console.log('Vision initialized');
        } catch (e) {
            console.error('Vision init failed:', e);
            document.querySelector('.loader').textContent = 'Error loading camera/model';
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    animate(time) {
        requestAnimationFrame(this.animate.bind(this));

        // Update particles with latest vision state
        // Use default 0.5 pinch (half size) if not ready, or just 0
        const pinch = this.vision.isReady ? this.vision.pinchDistance : 0.5;
        const handPos = this.vision.isReady ? this.vision.handCentroid : { x: 0.5, y: 0.5, z: 0 };
        const handRot = this.vision.isReady ? this.vision.handRotation : { x: 0, y: 0, z: 0 };

        // Time constant for smooth animation if needed
        this.particleSystem.update(time, pinch, handPos, handRot);

        // Render via composer
        this.composer.render();
    }
}

new App();
