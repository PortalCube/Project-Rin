import * as THREE from "three";
import { RinScene } from "./scenes/scene.js";
import { DefaultScene } from "./scenes/default.js";
import { RinInput } from "./input.js";

import terrain from "../assets/textures/terrain.png";

// 엔진 메인 object
export const RinEngine = {
    get width() {
        return window.innerWidth;
    },

    get height() {
        return window.innerHeight;
    },

    get ratio() {
        return window.innerWidth / window.innerHeight;
    },

    /**
     * @type {RinScene}
     */
    scene: null,

    /**
     * @type {THREE.WebGLRenderer}
     */
    renderer: null,

    /**
     * @type {THREE.Texture}
     */
    texture: null,

    enableGameUpdate: true,
    enableSceneUpdate: true,

    /*
     * framePerSecond
     * - DOM의 Canvas element에 1초당 얼마나 그릴지를 결정
     * - 플레이어의 입력 및 그래픽 출력등 즉각적인 반응이 필요한 로직은 FPS의 빈도로 처리
     *
     * tickPerSecond
     *  - RinEngine이 게임 로직을 1초당 얼마나 처리할지 결정
     *  - 농작물의 성장, 문의 열림 닫힘, 청크 생성 등 모든 게임 로직은 TPS의 빈도로 처리
     */
    framePerSecond: 0,
    tickPerSecond: 60,

    // ## Frame Update Variables
    _latestUpdateTime: performance.now(),

    // ## Scene Update Variables
    _frameElapsedTime: 0,
    _latestFrameUpdateTime: performance.now(),

    // ## Game Update Variables
    _tickElapsedTime: 0,
    _latestTickUpdateTime: performance.now(),

    get _frameInterval() {
        return this.framePerSecond > 0 ? 1000 / this.framePerSecond : 0;
    },

    get _tickInterval() {
        return this.tickPerSecond > 0 ? 1000 / this.tickPerSecond : 0;
    },
};

/**
 * RinScene을 불러옵니다.
 * @param {function} scene
 */
export function loadScene(Scene) {
    if (RinEngine.scene) {
        // 기존 Scene이 있다면 Unload 합니다.
        RinEngine.scene.status = RinScene.SceneStatus.Unloading;
        RinEngine.scene.onUnload();
        RinEngine.scene.status = RinScene.SceneStatus.Unloaded;
    }

    RinEngine.scene = new Scene();
    RinEngine.scene.status = RinScene.SceneStatus.Loading;
    RinEngine.scene.onLoad();
    RinEngine.scene.status = RinScene.SceneStatus.Loaded;
}

/**
 * WebGL Scene을 초기화하고 기본 Scene을 불러옵니다.
 * @param {HTMLCanvasElement} canvas
 */
export function createScene(canvas, Scene = DefaultScene) {
    RinEngine.renderer = new THREE.WebGLRenderer({ canvas });
    RinEngine.renderer.setSize(RinEngine.width, RinEngine.height);

    // 포인터를 잠급니다.
    RinInput.setPointerLock(true);

    // 텍스쳐 로드
    RinEngine.texture = new THREE.TextureLoader().load(terrain);
    RinEngine.texture.magFilter = THREE.NearestFilter;
    RinEngine.texture.minFilter = THREE.NearestMipmapLinearFilter;

    // 기본 Scene을 불러옵니다.
    loadScene(Scene);

    // 프레임 업데이트 함수 시작
    requestAnimationFrame(frameUpdate);
}

/**
 * 매 AnimationFrame 마다 호출되는 브라우저 업데이트 함수입니다.
 * @param {DOMHighResTimeStamp} currentTime
 */
function frameUpdate(currentTime) {
    const deltaTime = currentTime - RinEngine._latestUpdateTime;
    RinEngine._latestUpdateTime = currentTime;

    // ----- Scene Update -----
    if (RinEngine.enableSceneUpdate === false) {
        RinEngine._latestFrameUpdateTime = currentTime;
        requestAnimationFrame(frameUpdate);
        return;
    }

    RinEngine._frameElapsedTime += deltaTime;

    if (RinEngine._frameElapsedTime >= RinEngine._frameInterval) {
        sceneUpdate(currentTime - RinEngine._latestFrameUpdateTime);
        RinEngine._latestFrameUpdateTime = currentTime;
        RinEngine._frameElapsedTime -= RinEngine._frameInterval;
    }

    // ----- Game Update -----
    if (RinEngine.enableGameUpdate === false) {
        RinEngine._latestTickUpdateTime = currentTime;
        requestAnimationFrame(frameUpdate);
        return;
    }

    RinEngine._tickElapsedTime += deltaTime;

    if (RinEngine._tickElapsedTime >= RinEngine._tickInterval) {
        gameUpdate(currentTime - RinEngine._latestTickUpdateTime);
        RinEngine._latestTickUpdateTime = currentTime;
        RinEngine._tickElapsedTime -= RinEngine._tickInterval;
    }

    requestAnimationFrame(frameUpdate);
}

/**
 * 매 프레임 마다 호출되는 Scene 업데이트 함수입니다.
 */
function sceneUpdate(deltaTime) {
    deltaTime /= 1000;

    RinInput._preUpdate();

    const status = RinEngine.scene.status;

    if (status === RinScene.SceneStatus.Loaded) {
        RinEngine.scene.onFrameUpdate(deltaTime);

        const scene = RinEngine.scene.scene;
        const camera = RinEngine.scene.camera;
        const renderer = RinEngine.renderer;

        renderer.render(scene, camera);
    }

    RinInput._postUpdate();
}

/**
 * 매 게임 틱마다 호출되는 Game 업데이트 함수입니다.
 */
function gameUpdate(deltaTime) {
    deltaTime /= 1000;

    const status = RinEngine.scene.status;

    if (status === RinScene.SceneStatus.Loaded) {
        RinEngine.scene.onUpdate(deltaTime);
    }
}
