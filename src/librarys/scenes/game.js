// scenes/game.js
// 메인 GameScene입니다. 우리가 보통 게임이라고 부르는 바로 그 Scene입니다.

import * as THREE from "three";
import { RinScene } from "./scene.js";
import { Log } from "../log.js";
import { MAP_HEIGHT } from "../setting.js";
import { Player } from "../entities/player.js";
import { World } from "../worlds/world.js";

export class GameScene extends RinScene {
    /**
     * @type {Player}
     */
    player = null;

    constructor() {
        super();
    }

    onLoad() {
        super.onLoad();

        // Three.js Scene 생성
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // 새로운 월드 생성
        const world = new World(this);
        world.generate(320, MAP_HEIGHT);

        // 플레이어 생성
        this.player = new Player(this);
        this.scene.add(this.player.instance);

        const mesh = world.render(this.player);
        this.scene.add(mesh);

        Log.info("GameScene Loaded");
    }

    onUpdate(deltaTime) {
        super.onUpdate(deltaTime);
    }
}
