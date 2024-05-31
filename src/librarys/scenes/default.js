// scenes/default.js
// 기본 Scene입니다. 아무것도 없는 Scene입니다.

import * as THREE from "three";
import { RinScene } from "./scene.js";
import { RinEngine } from "../engine.js";
import { Log } from "../log.js";
import { FOV } from "../setting.js";

export class DefaultScene extends RinScene {
    constructor() {
        super();

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        this.camera = new THREE.PerspectiveCamera(
            FOV,
            RinEngine.ratio,
            0.1,
            1000
        );
        this.camera.position.z = 3;
    }

    onLoad() {
        super.onLoad();
    }

    onUpdate(deltaTime) {
        super.onUpdate(deltaTime);
    }

    OnUnload() {
        super.onUnload();
    }
}
