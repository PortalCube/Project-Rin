import { Block } from "./block.js";
import { CHUNK_SIZE } from "../setting.js";
import { Vector2, Vector3 } from "three";
import { getMinMax } from "../util.js";
import { Log } from "../log.js";
import { World } from "./world.js";

export class Chunk {
    /**
     * @type {World}
     */
    world = null;

    /**
     * @type {Block[][][]} [x][y][z]
     */
    blocks = [];

    /**
     * @type {Vector2} [x, z]
     */
    coordinate = null;

    /**
     * 청크의 최소 world X 좌표
     */
    minX = 0;

    /**
     * 청크의 최소 world Z 좌표
     */
    minZ = 0;

    constructor(world, coordinate = new Vector2(0, 0)) {
        this.world = world;
        this.coordinate = coordinate;

        const [minValue, _] = getMinMax(CHUNK_SIZE);
        this.minX = coordinate.x * CHUNK_SIZE + minValue;
        this.minZ = coordinate.y * CHUNK_SIZE + minValue;
    }

    /**
     * 비어있는 청크를 생성합니다.
     */
    generate(depth) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
            const yList = [];
            for (let y = 0; y < depth; y++) {
                const zList = [];
                for (let z = 0; z < CHUNK_SIZE; z++) {
                    const _x = this.minX + x;
                    const _y = y;
                    const _z = this.minZ + z;

                    let outOfBound = false;

                    if (
                        _x < this.world.minWorldValue ||
                        _x > this.world.maxWorldValue
                    ) {
                        outOfBound = true;
                    }

                    if (
                        _z < this.world.minWorldValue ||
                        _z > this.world.maxWorldValue
                    ) {
                        outOfBound = true;
                    }

                    if (outOfBound) {
                        zList.push(null);
                    } else {
                        zList.push(new Block(this, 0, new Vector3(_x, _y, _z)));
                    }
                }
                yList.push(zList);
            }
            this.blocks.push(yList);
        }
    }

    /**
     * Chunk의 렌더링 정보를 생성합니다.
     * @param {Map} infos 렌더링 정보
     * @returns {number} 렌더링 크기
     */
    getRenderInfos(infos) {
        let count = 0;

        for (const yList of this.blocks) {
            for (const zList of yList) {
                for (const block of zList) {
                    if (block) {
                        count += block.getRenderInfos(infos);
                    }
                }
            }
        }

        return count;
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

        return zList[z] || null;
    }
}
