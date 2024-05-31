import {
    registerCanvasInputEvent,
    registerResizeEvent,
    registerVisibilityChangeEvent,
} from "./dom.js";
import { createScene } from "./engine.js";
import { Log } from "./log.js";
import { GameScene } from "./scenes/game.js";
import { MAP_HEIGHT } from "./setting.js";
import { World } from "./worlds/world.js";

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

    const world = new World(16, MAP_HEIGHT);
    world.generate();

    Log.info(world.getBlock(-7, 32, 6));
}
