import * as THREE from "three";
import { RinEngine } from "../engine.js";
import { createEnum } from "../util.js";

export const SceneStatus = createEnum({
    Loading: 0,
    Loaded: 1,
    Unloading: 2,
    Unloaded: 3,
});

export class RinScene extends THREE.EventDispatcher {
    scene = null;
    camera = null;
    status = SceneStatus.Loading;

    static get SceneStatus() {
        return SceneStatus;
    }

    constructor() {
        super();
    }

    // Scene이 로드되었을 때 호출됩니다.
    onLoad() {
        // Scene에 load 이벤트를 fire합니다.
        this.dispatchEvent({ type: "load", scene: this });
    }

    // 매 게임 틱마다 호출됩니다.
    onUpdate(deltaTime) {
        this.dispatchEvent({ type: "update", scene: this, deltaTime });
    }

    // 매 프레임마다 호출됩니다.
    onFrameUpdate(deltaTime) {
        this.dispatchEvent({ type: "frameUpdate", scene: this, deltaTime });
    }

    // Scene이 언로드되었을 때 호출됩니다.
    onUnload() {
        this.dispatchEvent({ type: "unload", scene: this });
    }

    // Scene이 리사이즈되었을 때 호출됩니다.
    onResize() {
        this.dispatchEvent({ type: "resize", scene: this });

        this.camera.aspect = RinEngine.ratio;
        this.camera.updateProjectionMatrix();
    }
}
