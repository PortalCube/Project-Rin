import { RinEngine } from "../engine.js";
import { createEnum } from "../util.js";

export const SceneStatus = createEnum({
    Loading: 0,
    Loaded: 1,
    Unloading: 2,
    Unloaded: 3,
});

export class RinScene {
    scene = null;
    camera = null;
    status = SceneStatus.Loading;

    static get SceneStatus() {
        return SceneStatus;
    }

    constructor() {}

    // Scene이 로드되었을 때 호출됩니다.
    OnLoad() {
        this.status = SceneStatus.Loaded;
    }

    // Scene이 업데이트되었을 때 호출됩니다.
    OnUpdate(deltaTime) {}

    // Scene이 언로드되었을 때 호출됩니다.
    OnUnload() {
        this.status = SceneStatus.Unloaded;
    }

    // Scene이 리사이즈되었을 때 호출됩니다.
    OnResize() {
        this.camera.aspect = RinEngine.ratio;
        this.camera.updateProjectionMatrix();
    }
}
