import * as THREE from "three";
import { RinScene } from "./scenes/scene.js";
import { DefaultScene } from "./scenes/default.js";
import { RinInput } from "./input.js";

import tilemap from "../assets/textures/tilemap.png";

import { Log } from "./log.js";

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

    /**
     * @type {Stats}
     */
    stats: null,

    enableGameUpdate: true,
    enableSceneUpdate: true,
    enableFixedUpdate: true,

    /*
     * framePerSecond
     * - DOM의 Canvas element에 1초당 얼마나 그릴지(renderer.render)를 결정
     * - 플레이어의 입력 및 그래픽 출력등 즉각적인 반응이 필요한 로직은 FPS의 빈도로 처리
     *
     * tickPerSecond
     *  - RinEngine이 게임 로직(onUpdate)을 1초당 얼마나 처리할지 결정
     *  - 농작물의 성장, 문의 열림 닫힘, 청크 생성 등 모든 게임 로직은 TPS의 빈도로 처리
     *
     * fixedTimeStep
     *  - RinEngine이 물리 로직(onFixedUpdate)을 얼마나 자주 처리할지 결정
     *  - 플레이어의 충돌 및 이동은 이 빈도로 처리합니다.
     *
     *  이 값들은 0으로 설정시 모니터 주사율에 맞추어 최대한 자주 업데이트
     */
    framePerSecond: 0,
    tickPerSecond: 60,
    fixedTimeStep: 120,

    // ## Frame Update Variables
    _latestUpdateTime: performance.now(),

    // ## Scene Update Variables
    _frameElapsedTime: 0,
    _latestFrameUpdateTime: performance.now(),

    // ## Game Update Variables
    _tickElapsedTime: 0,
    _latestTickUpdateTime: performance.now(),

    // ## Fixed Update Variables
    _fixedElapsedTime: 0,

    get _frameInterval() {
        return this.framePerSecond > 0 ? 1000 / this.framePerSecond : 0;
    },

    get _tickInterval() {
        return this.tickPerSecond > 0 ? 1000 / this.tickPerSecond : 0;
    },

    get _fixedInterval() {
        return this.fixedTimeStep > 0 ? 1000 / this.fixedTimeStep : 0;
    },
};

/**
 * RinScene을 불러옵니다.
 * @param {function} scene
 * @returns {RinScene}
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
    // RinEngine.scene.onLoad();
    // RinEngine.scene.status = RinScene.SceneStatus.Loaded;

    return RinEngine.scene;
}

/**
 * WebGL Scene을 초기화하고 기본 Scene을 불러옵니다.
 * @param {HTMLCanvasElement} canvas
 * @param {function} Scene
 * @returns {RinScene}
 */
export function createScene(canvas, Scene = DefaultScene) {
    RinEngine.renderer = new THREE.WebGLRenderer({ canvas });
    RinEngine.renderer.setSize(RinEngine.width, RinEngine.height);

    // 포인터를 잠급니다.
    RinInput.setPointerLock(true);

    // 텍스쳐 로드
    RinEngine.texture = new THREE.TextureLoader().load(tilemap);
    RinEngine.texture.magFilter = THREE.NearestFilter;
    RinEngine.texture.minFilter = THREE.NearestMipmapLinearFilter;

    // 기본 Scene을 불러옵니다.
    const scene = loadScene(Scene);

    // 프레임 업데이트 함수 시작
    requestAnimationFrame(frameUpdate);

    return scene;
}

/**
 * 매 AnimationFrame 마다 호출되는 브라우저 업데이트 함수입니다.
 * @param {DOMHighResTimeStamp} currentTime
 */
function frameUpdate(currentTime) {
    const deltaTime = currentTime - RinEngine._latestUpdateTime;
    RinEngine._latestUpdateTime = currentTime;

    if (RinEngine.stats) {
        RinEngine.stats.update();
    }

    // ----- Scene Update -----
    if (RinEngine.enableSceneUpdate) {
        RinEngine._frameElapsedTime += deltaTime;

        if (RinEngine._frameElapsedTime >= RinEngine._frameInterval) {
            sceneUpdate(currentTime - RinEngine._latestFrameUpdateTime);
            RinEngine._frameElapsedTime -= RinEngine._frameInterval;
            RinEngine._latestFrameUpdateTime = currentTime;
        }
    } else {
        RinEngine._latestFrameUpdateTime = currentTime;
    }

    // ----- Game Update -----
    if (RinEngine.enableGameUpdate) {
        RinEngine._tickElapsedTime += deltaTime;

        if (RinEngine._tickElapsedTime >= RinEngine._tickInterval) {
            gameUpdate(currentTime - RinEngine._latestTickUpdateTime);
            RinEngine._tickElapsedTime -= RinEngine._tickInterval;
            RinEngine._latestTickUpdateTime = currentTime;
        }
    } else {
        RinEngine._latestTickUpdateTime = currentTime;
    }

    // ----- Fixed Update -----
    if (RinEngine.enableFixedUpdate) {
        RinEngine._fixedElapsedTime += deltaTime;

        while (RinEngine._fixedElapsedTime >= RinEngine._fixedInterval) {
            fixedUpdate(RinEngine._fixedInterval);
            RinEngine._fixedElapsedTime -= RinEngine._fixedInterval;
        }
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

    // Scene이 로드되지 않았다면 불러오기
    if (status === RinScene.SceneStatus.Loading) {
        RinEngine.scene.onLoad();
        RinEngine.scene.status = RinScene.SceneStatus.Loaded;
    }

    if (status === RinScene.SceneStatus.Loaded) {
        RinEngine.scene.onFrameUpdate(deltaTime);

        const scene = RinEngine.scene.scene;
        const camera = RinEngine.scene.camera;
        const renderer = RinEngine.renderer;

        renderer.render(scene, camera);
    }

    Log.watch("FPS", Math.round(1 / deltaTime));
    Log.watch("drawcall", RinEngine.renderer.info.render.calls);
    Log.watch("vertices", RinEngine.renderer.info.render.triangles * 3);

    Log._flushWatch();

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

/**
 * fixed time으로 호출되는 Game 업데이트 함수입니다.
 */
function fixedUpdate(fixedDeltaTime) {
    fixedDeltaTime /= 1000;

    const status = RinEngine.scene.status;

    if (status === RinScene.SceneStatus.Loaded) {
        RinEngine.scene.onFixedUpdate(fixedDeltaTime);
    }
}
