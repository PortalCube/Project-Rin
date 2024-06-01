// scenes/game.js
// 메인 GameScene입니다. 우리가 보통 게임이라고 부르는 바로 그 Scene입니다.

import * as THREE from "three";
import { RinScene } from "./scene.js";
import { Log } from "../log.js";
import { MAP_HEIGHT } from "../setting.js";
import { Player } from "../entities/player.js";
import { World } from "../worlds/world.js";
import { Sky } from "../entities/sky.js";

export class GameScene extends RinScene {
    /**
     * @type {Player}
     */
    player = null;

    /**
     * @type {Sky}
     */
    sky = null;

    /**
     * @type {World}
     */
    world = null;

    constructor() {
        super();
    }

    onLoad() {
        super.onLoad();

        // Three.js Scene 생성
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // 새로운 World 생성
        this.world = new World(this);
        this.world.generate(32, MAP_HEIGHT);

        // Player 생성
        this.player = new Player(this);
        this.scene.add(this.player.instance);

        // Sky 생성
        this.sky = new Sky(this);
        this.scene.add(this.sky.instance);

        // World의 Mesh를 만들어서 Scene에 render
        this.world.render();

        Log.info("GameScene Loaded");
    }

    onUpdate(deltaTime) {
        super.onUpdate(deltaTime);
    }
}
