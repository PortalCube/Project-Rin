import { useEffect, useState } from "react";
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
 * 주어진 canvas ref에서 게임을 구동합니다.
 * @param {React.MutableRefObject<null>} canvas
 * @returns {GameScene}
 */
export function useGame(canvas) {
    const [scene, setScene] = useState(null);
    const [active, setActive] = useState(false);

    useEffect(() => {
        if (canvas && canvas.current && active === false) {
            // GameScene을 생성하고 RinEngine에 등록
            const scene = createScene(canvas.current, GameScene);

            // 브라우저 visibilitychange 이벤트 등록
            registerVisibilityChangeEvent();

            // 브라우저 resize 이벤트 등록
            registerResizeEvent();

            // Canvas Input 이벤트 등록
            registerCanvasInputEvent(canvas.current);

            // 컨텍스트 메뉴 (마우스 우클릭 메뉴) 비활성화
            disableContextMenu(canvas.current);

            // 게임 상태를 true로 변경
            setActive(true);

            // Scene을 state에 저장
            setScene(scene);

            Log.info("Game Created");
        }
    }, [canvas, active]);

    return scene;
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
