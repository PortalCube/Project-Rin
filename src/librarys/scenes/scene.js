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

    _loadEvents = [];
    _updateEvents = [];
    _unloadEvents = [];

    static get SceneStatus() {
        return SceneStatus;
    }

    constructor() {}

    // Scene이 로드되었을 때 호출됩니다.
    onLoad() {
        this._loadEvents.forEach((callback) => callback());
    }

    // Scene이 업데이트되었을 때 호출됩니다.
    onUpdate(deltaTime) {
        this._updateEvents.forEach((callback) => callback(deltaTime));
    }

    // Scene이 언로드되었을 때 호출됩니다.
    onUnload() {
        this._unloadEvents.forEach((callback) => callback());
    }

    // Scene이 리사이즈되었을 때 호출됩니다.
    onResize() {
        this.camera.aspect = RinEngine.ratio;
        this.camera.updateProjectionMatrix();
    }

    registerLoadEvent(callback) {
        this._loadEvents.push(callback);
    }

    registerUpdateEvent(callback) {
        this._updateEvents.push(callback);
    }

    registerUnloadEvent(callback) {
        this._unloadEvents.push(callback);
    }
}
