import * as THREE from "three";
import { Entity } from "./entity.js";
import { RinScene } from "../scenes/scene.js";

import skyVertexShader from "../../assets/shaders/sky.vert?raw";
import skyFragmentShader from "../../assets/shaders/sky.frag?raw";

export class Sky extends Entity {
    /**
     * @type {THREE.Mesh}
     */
    instance = null;

    constructor(scene) {
        super(scene);

        const geometry = new THREE.SphereGeometry(1);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: [0.616, 0.941, 1] },
                bottomColor: { value: [0.306, 0.533, 0.839] },
            },
            vertexShader: skyVertexShader,
            fragmentShader: skyFragmentShader,
            side: THREE.BackSide,
        });

        this.instance = new THREE.Mesh(geometry, material);
    }

    onUpdate(deltaTime) {}

    onFrameUpdate(deltaTime) {
        // position을 Player의 position으로 지정
        this.instance.position.copy(this.scene.camera.position);
    }

    onUnload() {}
}
