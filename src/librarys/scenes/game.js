// scenes/game.js
// 메인 GameScene입니다. 우리가 보통 게임이라고 부르는 바로 그 Scene입니다.

import * as THREE from "three";
import { RinScene } from "./scene.js";
import { RinEngine } from "../engine.js";
import { Log } from "../log.js";
import { FOV } from "../setting.js";
import { Player } from "../entities/player.js";

export class GameScene extends RinScene {
    /**
     * @type {Player}
     */
    player = null;

    constructor() {
        super();

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        this.player = new Player(this);

        // 테스트용 큐브 만들기
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube1 = new THREE.Mesh(geometry, material);
        const cube2 = new THREE.Mesh(geometry, material);

        cube1.position.set(0, -2, 0);
        cube2.position.set(3, -2, 0);

        this.scene.add(cube1);
        this.scene.add(cube2);
        this.scene.add(this.player.instance);

        Log.info("GameScene Loaded");
    }

    onLoad() {
        super.onLoad();
    }

    onUpdate(deltaTime) {
        super.onUpdate(deltaTime);
    }
}
