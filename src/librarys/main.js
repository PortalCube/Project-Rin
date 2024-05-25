import { registerResizeEvent, registerVisibilityChangeEvent } from "./dom.js";
import { createScene } from "./engine.js";

// 게임 메인 객체
export const Game = {
    player: null,
    world: null,

    settings: {
        fov: 90,
    },
};

export function createGame(canvas) {
    // 엔진 초기화 및 프레임 업데이트 시작
    createScene(canvas);

    // 브라우저 visibilitychange 이벤트 등록
    registerVisibilityChangeEvent();

    // 브라우저 resize 이벤트 등록
    registerResizeEvent();
}
