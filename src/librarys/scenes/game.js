// scenes/game.js
// 메인 GameScene입니다. 우리가 보통 게임이라고 부르는 바로 그 Scene입니다.

import * as THREE from "three";
import { RinScene } from "./scene.js";
import { RinEngine } from "../engine.js";
import { Log } from "../log.js";
import { CHUNK_SIZE, FOV, GROUND_LEVEL, MAP_HEIGHT } from "../setting.js";
import { Player } from "../entities/player.js";
import { Block } from "../worlds/block.js";
import { World } from "../worlds/world.js";

export class GameScene extends RinScene {
    /**
     * @type {Player}
     */
    player = null;

    constructor() {
        super();

        Log.info("GameScene Loaded");
    }

    onLoad() {
        super.onLoad();

        // Three.js Scene 생성
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // 새로운 월드 생성
        const world = new World(this);
        world.generate(16, MAP_HEIGHT);

        // 플레이어 생성
        this.player = new Player(this);
        this.scene.add(this.player.instance);

        const chunkLength = world.maxChunkValue - world.minChunkValue + 1;

        for (let cx = 0; cx < chunkLength; cx++) {
            for (let cz = 0; cz < chunkLength; cz++) {
                const chunk = world.chunks[cx][cz];
                for (let x = 0; x < CHUNK_SIZE; x++) {
                    for (let y = 0; y < MAP_HEIGHT; y++) {
                        for (let z = 0; z < CHUNK_SIZE; z++) {
                            const block = chunk.getBlock(x, y, z);

                            if (block.id !== 0) {
                                const mesh = block.load();

                                if (mesh) {
                                    this.scene.add(mesh);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    onUpdate(deltaTime) {
        super.onUpdate(deltaTime);
    }
}
