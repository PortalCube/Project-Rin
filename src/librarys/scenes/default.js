// scenes/default.js
// 기본 Scene입니다. 아무것도 없는 Scene입니다.

import { PerspectiveCamera, Scene } from "three";
import * as THREE from "three";
import { RinScene } from "./scene.js";
import { RinEngine } from "../engine.js";
import { Log } from "../log.js";

export class DefaultScene extends RinScene {
    constructor() {
        super();

        this.scene = new Scene();
        this.scene.background = new THREE.Color(0x000000);

        this.camera = new PerspectiveCamera(90, RinEngine.ratio, 0.1, 1000);
        this.camera.position.z = 3;
    }

    OnLoad() {
        super.OnLoad();
    }

    OnUpdate(deltaTime) {
        super.OnUpdate(deltaTime);
    }

    // OnUnload() {
    //     super.OnUnload();
    // }

    // OnResize() {
    //     super.OnResize();
    // }
}
