// scenes/default.js
// 기본 Scene입니다. 아무것도 없는 Scene입니다.

import * as THREE from "three";
import { RinScene } from "./scene.js";
import { RinEngine } from "../engine.js";
import { Log } from "../log.js";
import { CAMERA_FAR, CAMERA_FOV, CAMERA_NEAR } from "../setting.js";

export class DefaultScene extends RinScene {
    constructor() {
        super();
    }

    onLoad() {
        super.onLoad();

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        this.camera = new THREE.PerspectiveCamera(
            CAMERA_FOV,
            RinEngine.ratio,
            CAMERA_NEAR,
            CAMERA_FAR
        );

        Log.info("DefaultScene Loaded");
    }
}
