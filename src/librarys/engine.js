import * as THREE from "three";

// 엔진 메인 객체
export const RinEngine = {
    // Three.js Variables
    scene: null,
    renderer: null,
    camera: null,

    // Scene Variables
    enableSceneUpdate: true,
    framePerSecond: 0,

    // Game Tick Variables
    enableGameUpdate: true,
    tickPerSecond: 60,

    // Frame Update Variables
    _latestUpdateTime: performance.now(),

    // Scene Update Variables
    _frameElapsedTime: 0,
    _latestFrameUpdateTime: performance.now(),

    get _frameInterval() {
        return this.framePerSecond > 0 ? 1000 / this.framePerSecond : 0;
    },

    // Game Update Variables
    _tickElapsedTime: 0,
    _latestTickUpdateTime: performance.now(),

    get _tickInterval() {
        return this.tickPerSecond > 0 ? 1000 / this.tickPerSecond : 0;
    },
};

/**
 * WebGL Scene을 초기화합니다.
 * @param {HTMLCanvasElement} canvas
 */
export function createScene(canvas) {
    const width = window.clientWidth;
    const height = window.clientHeight;

    const ratio = width / height;

    RinEngine.scene = new THREE.Scene();
    RinEngine.renderer = new THREE.WebGLRenderer({ canvas });
    RinEngine.camera = new THREE.PerspectiveCamera(90, ratio, 0.1, 1000);

    RinEngine.camera.position.z = 5;
    RinEngine.renderer.setSize(width, height);
    RinEngine.scene.background = new THREE.Color(0xafafaf);

    // 프레임 업데이트 함수 시작
    requestAnimationFrame(frameUpdate);
}

/**
 * 매 AnimationFrame 마다 호출되는 브라우저 업데이트 함수입니다.
 */
function frameUpdate(currentTime) {
    requestAnimationFrame(frameUpdate);

    const deltaTime = currentTime - RinEngine._latestUpdateTime;
    RinEngine._latestUpdateTime = currentTime;

    // ----- Scene Update -----
    if (RinEngine.enableSceneUpdate === false) {
        RinEngine._latestFrameUpdateTime = currentTime;
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
        return;
    }

    RinEngine._tickElapsedTime += deltaTime;

    if (RinEngine._tickElapsedTime >= RinEngine._tickInterval) {
        gameUpdate(currentTime - RinEngine._latestTickUpdateTime);
        RinEngine._latestTickUpdateTime = currentTime;
        RinEngine._tickElapsedTime -= RinEngine._tickInterval;
    }
}

/**
 * 매 프레임 마다 호출되는 Scene 업데이트 함수입니다.
 */
function sceneUpdate(deltaTime) {
    RinEngine.renderer.render(RinEngine.scene, RinEngine.camera);
}

/**
 * 매 게임 틱마다 호출되는 Game 업데이트 함수입니다.
 */
function gameUpdate(deltaTime) {}
