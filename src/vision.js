import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

export class Vision {
    constructor() {
        this.videoElement = document.getElementById('input-video');
        this.hands = null;
        this.camera = null;
        this.isReady = false;
        this.lastResult = null;

        // Public state
        this.pinchDistance = 0; // 0.0 to 1.0 (clamped)
        this.isPinching = false;
        this.handCentroid = { x: 0, y: 0, z: 0 };
        this.handRotation = { x: 0, y: 0, z: 0 }; // Euler angles
    }

    async init() {
        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        this.hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.3,
            minTrackingConfidence: 0.3
        });

        this.hands.onResults(this.onResults.bind(this));

        this.camera = new Camera(this.videoElement, {
            onFrame: async () => {
                await this.hands.send({ image: this.videoElement });
            },
            width: 1280,
            height: 720
        });

        await this.camera.start();
        this.isReady = true;
    }

    onResults(results) {
        this.lastResult = results;

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];

            // Calculate Pinch (Thumb Tip 4 vs Index Tip 8)
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];

            // Euclidean distance
            const distance = Math.sqrt(
                Math.pow(thumbTip.x - indexTip.x, 2) +
                Math.pow(thumbTip.y - indexTip.y, 2) +
                Math.pow(thumbTip.z - indexTip.z, 2)
            );

            // Normalize distance (roughly 0.02 is closed, 0.2 is open for typical hand distance)
            // We want 0 (closed) to 1 (open)
            // Or maybe 1 (closed/pinched) for "concentration" effects?
            // The prompt says "Hands open/close control scale/diffusion"
            // Let's map small distance -> 0, large -> 1
            const minD = 0.01;
            const maxD = 0.2;
            this.pinchDistance = Math.min(Math.max((distance - minD) / (maxD - minD), 0), 1);

            this.isPinching = this.pinchDistance < 0.1;

            // Hand Position (Palm center roughly 0, 9, 5, 17 average)
            // Or just wrist (0)
            this.handCentroid = landmarks[9]; // Middle finger mcp

            // Calculate Hand Rotation from palm landmarks
            // Use index (5), middle (9), ring (13), pinky (17) base to create palm plane normal
            const indexBase = landmarks[5];
            const middleBase = landmarks[9];
            const ringBase = landmarks[13];
            const pinkyBase = landmarks[17];

            // Vector along the palm (from pinky to index)
            const palmX = {
                x: indexBase.x - pinkyBase.x,
                y: indexBase.y - pinkyBase.y,
                z: indexBase.z - pinkyBase.z
            };

            // Vector along the palm depth (from ring to middle)
            const palmY = {
                x: middleBase.x - ringBase.x,
                y: middleBase.y - ringBase.y,
                z: middleBase.z - ringBase.z
            };

            // Normal to palm (cross product) = perpendicular to hand surface
            const palmNormal = {
                x: palmX.y * palmY.z - palmX.z * palmY.y,
                y: palmX.z * palmY.x - palmX.x * palmY.z,
                z: palmX.x * palmY.y - palmX.y * palmY.x
            };

            const normalLen = Math.sqrt(palmNormal.x * palmNormal.x + palmNormal.y * palmNormal.y + palmNormal.z * palmNormal.z);

            if (normalLen > 0) {
                // Normalize vectors
                const nPalmX = { x: palmX.x / Math.sqrt(palmX.x * palmX.x + palmX.y * palmX.y + palmX.z * palmX.z) || 1,
                               y: palmX.y / Math.sqrt(palmX.x * palmX.x + palmX.y * palmX.y + palmX.z * palmX.z) || 1,
                               z: palmX.z / Math.sqrt(palmX.x * palmX.x + palmX.y * palmX.y + palmX.z * palmX.z) || 1 };

                const nPalmNormal = { x: palmNormal.x / normalLen, y: palmNormal.y / normalLen, z: palmNormal.z / normalLen };

                // Rotation from palmX direction and normal
                // When hand faces camera: palmNormal should point toward camera (z > 0)
                // Scale down rotation to 0.3x for subtle effect
                this.handRotation.x = Math.atan2(nPalmNormal.y, nPalmNormal.z) * 0.3;
                this.handRotation.y = Math.atan2(-nPalmNormal.x, Math.sqrt(nPalmNormal.y * nPalmNormal.y + nPalmNormal.z * nPalmNormal.z)) * 0.3;
                this.handRotation.z = Math.atan2(nPalmX.y, nPalmX.x) * 0.3;
            }
        } else {
            // Smoothly decay or reset?
            // Keep last known for stability or reset
        }
    }
}
