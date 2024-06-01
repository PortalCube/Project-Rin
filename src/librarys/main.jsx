import {
    registerCanvasInputEvent,
    registerResizeEvent,
    registerVisibilityChangeEvent,
} from "./dom.js";
import { RinEngine, createScene } from "./engine.js";
import { Log } from "./log.js";
import { GameScene } from "./scenes/game.js";

import Stats from "three/addons/libs/stats.module.js";

/**
 * 주어진 canvas element에 게임을 생성합니다.
 * @param {HTMLCanvasElement} canvas
 */
export async function createGame(canvas) {
    // 엔진 초기화 및 프레임 업데이트 시작
    createScene(canvas, GameScene);

    // 브라우저 visibilitychange 이벤트 등록
    registerVisibilityChangeEvent();

    // 브라우저 resize 이벤트 등록
    registerResizeEvent();

    // Canvas Input 이벤트 등록
    registerCanvasInputEvent(canvas);
}

export function useStats() {
    if (RinEngine.stats === null) {
        RinEngine.stats = new Stats();
    }

    return <div ref={(ref) => ref.appendChild(RinEngine.stats.dom)}></div>;
}
