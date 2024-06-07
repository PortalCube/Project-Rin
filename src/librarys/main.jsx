import {
    disableContextMenu,
    registerCanvasInputEvent,
    registerResizeEvent,
    registerVisibilityChangeEvent,
} from "./dom.js";
import { RinEngine, createScene } from "./engine.js";
import { Log } from "./log.js";
import { GameScene } from "./scenes/game.js";

import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";

/**
 * 주어진 canvas element에 게임을 생성합니다.
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLDivElement} debug
 */
export async function createGame(canvas, debug) {
    // 디버그 요소 등록
    Log.element = debug;

    // 엔진 초기화 및 프레임 업데이트 시작
    createScene(canvas, GameScene);

    // 브라우저 visibilitychange 이벤트 등록
    registerVisibilityChangeEvent();

    // 브라우저 resize 이벤트 등록
    registerResizeEvent();

    // Canvas Input 이벤트 등록
    registerCanvasInputEvent(canvas);

    // 컨텍스트 메뉴 (마우스 우클릭 메뉴) 비활성화
    disableContextMenu(canvas);
}

export function useStats() {
    if (RinEngine.stats === null) {
        RinEngine.stats = new Stats();
    }

    return <div ref={(ref) => ref.appendChild(RinEngine.stats.dom)}></div>;
}

window.THREE = THREE;
