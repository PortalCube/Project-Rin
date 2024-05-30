import { Block } from "./block.js";
import { CHUNK_SIZE } from "../setting.js";
import { Vector2, Vector3 } from "three";
import { getMinMax } from "../util.js";
import { Log } from "../log.js";

export class Chunk {
    /**
     * @type {Block[][][]} [x][y][z]
     */
    blocks = [];

    /**
     * @type {Vector2} [x, z]
     */
    coordinate = null;

    /**
     * 청크 시작 X 좌표
     */
    chunkStartX = 0;

    /**
     * 청크 시작 Z 좌표
     */
    chunkStartZ = 0;

    constructor(depth, coordinate = new Vector2(0, 0)) {
        this.coordinate = coordinate;

        const [minValue, _] = getMinMax(CHUNK_SIZE);
        this.chunkStartX = coordinate.x * CHUNK_SIZE + minValue;
        this.chunkStartZ = coordinate.y * CHUNK_SIZE + minValue;

        // 청크 내부 블록 초기화
        for (let x = 0; x < CHUNK_SIZE; x++) {
            const yList = [];
            for (let y = 0; y < depth; y++) {
                const zList = [];
                for (let z = 0; z < CHUNK_SIZE; z++) {
                    // 공기 블록으로 초기화
                    const _x = this.chunkStartX + x;
                    const _y = y;
                    const _z = this.chunkStartZ + z;
                    zList.push(new Block(0, new Vector3(_x, _y, _z)));
                }
                yList.push(zList);
            }
            this.blocks.push(yList);
        }
    }

    /**
     * 청크 좌표를 받아와 해당 좌표에 블록을 지정합니다.
     * @param {number} x X좌표
     * @param {number} y Y좌표
     * @param {number} z Z좌표
     * @param {Block} block 블록
     */
    setBlock(x, y, z, block) {
        const yList = this.blocks[x];
        if (!yList) return;

        const zList = yList[y];
        if (!zList) return;

        zList[z] = block;
    }

    /**
     * 청크 좌표를 받아와 해당 좌표의 블록을 반환합니다.
     * @param {number} x X좌표
     * @param {number} y Y좌표
     * @param {number} z Z좌표
     * @returns {Block} 해당 청크 좌표의 블록
     */
    getBlock(x, y, z) {
        const yList = this.blocks[x];
        if (!yList) return null;

        const zList = yList[y];
        if (!zList) return null;

        return zList[z];
    }
}
