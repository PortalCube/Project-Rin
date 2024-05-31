import { Vector2 } from "three";
import { Log } from "../log.js";
import { CHUNK_SIZE, GROUND_LEVEL, MAP_HEIGHT } from "../setting.js";
import { getChunkCoordinate, getChunkIndex, getMinMax, mod } from "../util.js";
import { Block } from "./block.js";
import { Chunk } from "./chunk.js";

export class World {
    /**
     * @type {RinScene}
     */
    scene = null;

    /**
     * @type {Chunk[][]} [x][z]
     */
    chunks = [];

    width = 0;
    height = 0;
    depth = 0;

    minWorldValue = 0;
    maxWorldValue = 0;

    minChunkValue = 0;
    maxChunkValue = 0;

    constructor(scene) {
        this.scene = scene;
    }

    /**
     * 맵에 청크와 블록을 채워서 새로운 맵을 생성합니다.
     */
    generate(size, depth = MAP_HEIGHT) {
        this.width = size;
        this.height = size;
        this.depth = depth;

        [this.minWorldValue, this.maxWorldValue] = getMinMax(this.width);
        this.minChunkValue = getChunkIndex(this.minWorldValue, CHUNK_SIZE);
        this.maxChunkValue = getChunkIndex(this.maxWorldValue, CHUNK_SIZE);

        Log.info(
            `world size [${this.minWorldValue} ~ ${this.maxWorldValue}] (${this.width})`
        );
        Log.info(
            `chunk size [${this.minChunkValue} ~ ${this.maxChunkValue}] (${CHUNK_SIZE})`
        );

        // 1. 청크를 생성합니다. 청크는 공기 블록으로 채워집니다.
        for (let x = this.minChunkValue; x <= this.maxChunkValue; x++) {
            const list = [];
            for (let z = this.minChunkValue; z <= this.maxChunkValue; z++) {
                const chunk = new Chunk(this, new Vector2(x, z));
                chunk.generate(this.depth);
                list.push(chunk);
            }
            this.chunks.push(list);
        }

        // 2. 맵 생성 알고리즘을 적용합니다. 여기서는 매우 간단한 알고리즘을 적용하였습니다.
        let blockId = 0;
        for (let y = 0; y < this.depth; y++) {
            // GROUND_LEVEL 미만의 y좌표는 돌로 채우기
            // GROUND_LEVEL의 y좌표는 잔디로 채우기
            // GROUND_LEVEL 초과의 y좌표는 공기로 채우기

            if (y < GROUND_LEVEL) {
                blockId = 1;
            } else if (y === GROUND_LEVEL) {
                blockId = 2;
            } else {
                blockId = 0;
            }

            for (let x = this.minWorldValue; x <= this.maxWorldValue; x++) {
                for (let z = this.minWorldValue; z <= this.maxWorldValue; z++) {
                    this.getBlock(x, y, z).id = blockId;
                }
            }
        }
    }

    /**
     * x, z world 좌표가 가리키는 청크를 구합니다.
     * @param {number} x
     * @param {number} z
     * @returns {Chunk}
     */
    getChunk(x, z) {
        const i = getChunkIndex(x, CHUNK_SIZE) - this.minChunkValue;
        const j = getChunkIndex(z, CHUNK_SIZE) - this.minChunkValue;

        const yList = this.chunks[i];
        if (!yList) return null;

        return yList[j] || null;
    }

    /**
     * x, z world 좌표가 가리키는 청크를 지정합니다.
     * @param {number} x
     * @param {number} z
     * @param {Chunk} chunk
     */
    setChunk(x, z, chunk) {
        const i = getChunkIndex(x, CHUNK_SIZE) - this.minChunkValue;
        const j = getChunkIndex(z, CHUNK_SIZE) - this.minChunkValue;
        this.chunks[i][j] = chunk;
    }

    /**
     * x, y, z world 좌표가 가리키는 블록을 반환합니다.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {Block}
     */
    getBlock(x, y, z) {
        const chunk = this.getChunk(x, z);

        if (!chunk) {
            return null;
        }

        const _x = getChunkCoordinate(x, CHUNK_SIZE);
        const _z = getChunkCoordinate(z, CHUNK_SIZE);

        return chunk.getBlock(_x, y, _z);
    }

    /**
     * x, y, z world 좌표가 가리키는 블록을 지정합니다.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {Block} block world 좌표에 지정할 블록
     */
    setBlock(x, y, z, block) {
        const chunk = this.getChunk(x, z);

        if (!chunk) {
            return;
        }

        const _x = getChunkCoordinate(x, CHUNK_SIZE);
        const _z = getChunkCoordinate(z, CHUNK_SIZE);

        chunk.setBlock(_x, y, _z, block);
    }
}
