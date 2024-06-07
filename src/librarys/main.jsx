import { useState } from "react";
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
export function createGame(canvas, debug) {
    // 디버그 요소 등록
    Log.element = debug;

    // GameScene을 생성하고 RinEngine에 등록
    createScene(canvas, GameScene);

    // 브라우저 visibilitychange 이벤트 등록
    registerVisibilityChangeEvent();

    // 브라우저 resize 이벤트 등록
    registerResizeEvent();

    // Canvas Input 이벤트 등록
    registerCanvasInputEvent(canvas);

    // 컨텍스트 메뉴 (마우스 우클릭 메뉴) 비활성화
    disableContextMenu(canvas);

    return RinEngine.scene;
}

export function isCreated() {
    return RinEngine.scene !== null;
}

export function useStats() {
    const [element, setElement] = useState(null);

    if (RinEngine.stats === null) {
        RinEngine.stats = new Stats();

        // State에 JSX.Element 구겨넣기
        // 나중에 더 좋은 방법으로 바꾸기....
        setElement(
            <div ref={(ref) => ref.appendChild(RinEngine.stats.dom)}></div>
        );
    }

    return element;
}

window.THREE = THREE;
