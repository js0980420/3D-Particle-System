import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particleCount = 15000;
        this.particles = null;
        this.geometry = null;
        this.material = null;

        this.color = new THREE.Color('#00ffff');
        this.template = 'heart';

        // Data arrays
        this.initialPositions = [];
        this.targetPositions = new Float32Array(this.particleCount * 3);


        this.init();
    }

    init() {
        this.geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);

        // Random init
        for (let i = 0; i < this.particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Generate texture
        const sprite = this.getTexture();

        this.material = new THREE.PointsMaterial({
            size: 0.15,
            map: sprite,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            color: this.color
        });

        this.particles = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.particles);

        // Set info for first template
        this.setTemplate('heart');
    }

    getTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(0.4, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    setTemplate(type) {
        this.template = type;
        const positions = this.targetPositions; // ref
        const count = this.particleCount;

        switch (type) {
            case 'heart':
                for (let i = 0; i < count; i++) {
                    // Parametric Heart
                    // x = 16sin^3(t)
                    // y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
                    // z = random thickness
                    const t = Math.random() * Math.PI * 2;
                    const scale = 0.15;
                    const x = 16 * Math.pow(Math.sin(t), 3);
                    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

                    // We need to distribute points along the curve, slightly roughly
                    // Just random t gives more points at slow spots, that's fine
                    // 3D volume heart
                    const r = Math.random(); // 0-1
                    // Add some spread
                    const spread = (Math.random() - 0.5) * 2;

                    positions[i * 3] = x * scale + (Math.random() - 0.5) * 0.5;
                    positions[i * 3 + 1] = y * scale + (Math.random() - 0.5) * 0.5;
                    positions[i * 3 + 2] = spread;
                }
                break;

            case 'flower':
                for (let i = 0; i < count; i++) {
                    const rBase = Math.sqrt(Math.random()) * 5;
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.random() * Math.PI; // for 3D sphere feel? No, flower is 2.5D

                    // Rose curve k=5
                    const k = 5;
                    const r = Math.cos(k * theta) * 3 + 1; // +1 to have body

                    // Distribute particles in petals
                    const u = Math.random();
                    // Mix standard disk and rose curve
                    const finalR = u * r;

                    positions[i * 3] = finalR * Math.cos(theta);
                    positions[i * 3 + 1] = finalR * Math.sin(theta);
                    positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5; // Thickness
                }
                break;

            case 'saturn':
                for (let i = 0; i < count; i++) {
                    const isRing = Math.random() > 0.4;

                    if (isRing) {
                        // Ring
                        const inner = 5;
                        const outer = 9;
                        const r = inner + Math.random() * (outer - inner);
                        const theta = Math.random() * Math.PI * 2;

                        positions[i * 3] = r * Math.cos(theta);
                        positions[i * 3 + 1] = (Math.random() - 0.5) * 0.2; // Thin ring
                        positions[i * 3 + 2] = r * Math.sin(theta);

                        // Tilt
                        const tilt = Math.PI / 6;
                        const y = positions[i * 3 + 1];
                        const z = positions[i * 3 + 2];
                        positions[i * 3 + 1] = y * Math.cos(tilt) - z * Math.sin(tilt);
                        positions[i * 3 + 2] = y * Math.sin(tilt) + z * Math.cos(tilt);

                    } else {
                        // Planet Sphere
                        const r = 3;
                        // Random point in sphere
                        const u = Math.random();
                        const v = Math.random();
                        const theta = 2 * Math.PI * u;
                        const phi = Math.acos(2 * v - 1);
                        const radius = Math.cbrt(Math.random()) * r; // Volume distribution

                        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
                        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                        positions[i * 3 + 2] = radius * Math.cos(phi);
                    }
                }
                break;

            case 'fireworks':
                for (let i = 0; i < count; i++) {
                    // Random vector from center
                    const u = Math.random();
                    const v = Math.random();
                    const theta = 2 * Math.PI * u;
                    const phi = Math.acos(2 * v - 1);

                    const r = Math.random() * 8;

                    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                    positions[i * 3 + 2] = r * Math.cos(phi);
                }
                break;
        }
    }

    setColor(hex) {
        this.color.set(hex);
        this.material.color = this.color;
    }

    update(time, pinchDistance, handPos = { x: 0.5, y: 0.5, z: 0 }, handRot = { x: 0, y: 0, z: 0 }) {
        // Linear Interpolation factor towards target
        // If pinchDistance is large (open hand), we expand -> multiply target positions?
        // Let's say targetPositions is the BASE shape.
        // We modify the "visual" position based on pinch.

        const positions = this.particles.geometry.attributes.position.array;

        // Pinch Logic:
        // 0 (Closed) -> Compact (Scale 0.5)
        // 1 (Open) -> Expand (Scale 2.0)
        // Let's smooth the pinch.

        // But also we want to LERP current points to target points.
        // And Apply the Scale.

        const scale = 0.3 + (pinchDistance * 3.0); // 0.3 to 3.3
        const drift = 0.05 * (pinchDistance + 0.1); // More drift when open

        // Convert hand position (0-1 range) to world coordinates
        const handWorldX = (0.5 - handPos.x) * 50; // Map to -25 to 25 (inverted)
        const handWorldY = (0.5 - handPos.y) * 35; // Map to -17.5 to 17.5 (invert Y)
        const handWorldZ = handPos.z * 15; // Map depth

        for (let i = 0; i < this.particleCount; i++) {
            const ix = i * 3;
            const iy = i * 3 + 1;
            const iz = i * 3 + 2;

            // Target
            let tx = this.targetPositions[ix] * scale;
            let ty = this.targetPositions[iy] * scale;
            let tz = this.targetPositions[iz] * scale;

            // Apply hand rotation to target position (commented out for now)
            // Rotation X (pitch)
            // let rotX_1 = tx;
            // let rotY_1 = ty * Math.cos(handRot.x) - tz * Math.sin(handRot.x);
            // let rotZ_1 = ty * Math.sin(handRot.x) + tz * Math.cos(handRot.x);

            // Rotation Y (yaw)
            // let rotX_2 = rotX_1 * Math.cos(handRot.y) + rotZ_1 * Math.sin(handRot.y);
            // let rotY_2 = rotY_1;
            // let rotZ_2 = -rotX_1 * Math.sin(handRot.y) + rotZ_1 * Math.cos(handRot.y);

            // Rotation Z (roll)
            // let rotX_3 = rotX_2 * Math.cos(handRot.z) - rotY_2 * Math.sin(handRot.z);
            // let rotY_3 = rotX_2 * Math.sin(handRot.z) + rotY_2 * Math.cos(handRot.z);
            // let rotZ_3 = rotZ_2;

            // Apply hand world position
            // tx = rotX_3 + handWorldX;
            // ty = rotY_3 + handWorldY;
            // tz = rotZ_3 + handWorldZ;

            // Direct position without rotation
            tx = tx + handWorldX;
            ty = ty + handWorldY;
            tz = tz + handWorldZ;

            // Current
            const cx = positions[ix];
            const cy = positions[iy];
            const cz = positions[iz];

            // Move towards target (ease in)
            positions[ix] += (tx - cx) * 0.1;
            positions[iy] += (ty - cy) * 0.1;
            positions[iz] += (tz - cz) * 0.1;

        }

        this.particles.geometry.attributes.position.needsUpdate = true;
    }
}
