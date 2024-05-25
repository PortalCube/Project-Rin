import * as THREE from "three";

// 엔진 메인 객체
export const Rin = {
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
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const ratio = width / height;

    Rin.scene = new THREE.Scene();
    Rin.renderer = new THREE.WebGLRenderer({ canvas });
    Rin.camera = new THREE.PerspectiveCamera(90, ratio, 0.1, 1000);

    Rin.camera.position.z = 5;
    Rin.renderer.setSize(width, height);
    Rin.scene.background = new THREE.Color(0xafafaf);

    // 프레임 업데이트 함수 시작
    requestAnimationFrame(frameUpdate);
}

/**
 * 매 AnimationFrame 마다 호출되는 브라우저 업데이트 함수입니다.
 */
function frameUpdate(currentTime) {
    requestAnimationFrame(frameUpdate);

    const deltaTime = currentTime - Rin._latestUpdateTime;
    Rin._latestUpdateTime = currentTime;

    // ----- Scene Update -----
    if (Rin.enableSceneUpdate === false) {
        Rin._latestFrameUpdateTime = currentTime;
        return;
    }

    Rin._frameElapsedTime += deltaTime;

    if (Rin._frameElapsedTime >= Rin._frameInterval) {
        sceneUpdate(currentTime - Rin._latestFrameUpdateTime);
        Rin._latestFrameUpdateTime = currentTime;
        Rin._frameElapsedTime -= Rin._frameInterval;
    }

    // ----- Game Update -----
    if (Rin.enableGameUpdate === false) {
        Rin._latestTickUpdateTime = currentTime;
        return;
    }

    Rin._tickElapsedTime += deltaTime;

    if (Rin._tickElapsedTime >= Rin._tickInterval) {
        gameUpdate(currentTime - Rin._latestTickUpdateTime);
        Rin._latestTickUpdateTime = currentTime;
        Rin._tickElapsedTime -= Rin._tickInterval;
    }
}

/**
 * 매 프레임 마다 호출되는 Scene 업데이트 함수입니다.
 */
function sceneUpdate(deltaTime) {
    Rin.renderer.render(Rin.scene, Rin.camera);
}

/**
 * 매 게임 틱마다 호출되는 Game 업데이트 함수입니다.
 */
function gameUpdate(deltaTime) {}
