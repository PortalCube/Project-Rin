import * as THREE from "three";
import { createEnum, randomRange } from "../util.js";
import { TILE_MAP_SIZE } from "../setting.js";

import BlockData from "../items/blocks.json";

//prettier-ignore
export const Direction = createEnum({
    Right: 0, // X+
    Left:  1, // X-
    Up:    2, // Y+
    Down:  3, // Y-
    Front: 4, // Z+
    Back:  5, // Z-
});

const PI_2 = Math.PI / 2;

export function getDirectionVector(direction) {
    switch (direction) {
        case Direction.Right:
            return new THREE.Vector3(1, 0, 0);
        case Direction.Left:
            return new THREE.Vector3(-1, 0, 0);
        case Direction.Up:
            return new THREE.Vector3(0, 1, 0);
        case Direction.Down:
            return new THREE.Vector3(0, -1, 0);
        case Direction.Front:
            return new THREE.Vector3(0, 0, 1);
        case Direction.Back:
            return new THREE.Vector3(0, 0, -1);
    }
}

function getUVOffset(id, tileSize = TILE_MAP_SIZE) {
    const size = 1 / tileSize;
    const x = (id % tileSize) * size;
    const y = (tileSize - Math.floor(id / tileSize) - 1) * size;

    return [x, y];
}

export class Block {
    /**
     * @type {Chunk}
     */
    chunk = null;

    _id = 0;
    _active = false;

    /**
     * @type {THREE.Vector3}
     */
    coordinate = null;

    direction = null;

    /**
     * @type {THREE.Mesh}
     */
    instance = null;

    /**
     * @type {THREE.BoxGeometry}
     */
    geometry = null;

    /**
     * @type {THREE.ShaderMaterial}
     */
    material = null;

    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
        this.active = this._id !== 0;
    }

    get active() {
        return this._active;
    }

    set active(value) {
        if (value !== this._active) {
            // 인접 블록 렌더링 업데이트 필요
        }

        this._active = value;
    }

    static get Direction() {
        return Direction;
    }

    static getDirectionVector = getDirectionVector;

    constructor(
        chunk,
        id = 0,
        coordinate = new THREE.Vector3(0, 0, 0),
        direction = Direction.Front
    ) {
        this.chunk = chunk;
        this.id = id;
        this.coordinate = coordinate;
        this.direction = direction;
    }

    /**
     * direction 방향에 맞닿은 블록을 가져옵니다.
     * @param {number} direction
     * @returns {Block} direction 방향으로 맞닿은 블록
     */
    getNearBlock(direction) {
        const directionVector = getDirectionVector(direction);
        const targetCoordinate = this.coordinate.clone().add(directionVector);

        const x = targetCoordinate.x;
        const y = targetCoordinate.y;
        const z = targetCoordinate.z;

        return this.chunk.world.getBlock(x, y, z);
    }

    /**
     * Block의 렌더링 정보를 생성합니다. 렌더링 정보는 Block의 각 face 별로 생성됩니다.
     * @param {Map} infos 렌더링 정보
     * @returns {number} 렌더링 크기
     */
    getRenderInfos(infos) {
        const blockInfos = this._getRenderInfos();

        if (blockInfos === null) {
            return 0;
        }

        const key = `${this.coordinate.x}:${this.coordinate.y}:${this.coordinate.z}`;
        infos.set(key, blockInfos);

        return blockInfos.infos.length;
    }

    _getNearBlockDirections() {
        const directions = [];

        for (let direction = 0; direction < 6; direction++) {
            const block = this.getNearBlock(direction);

            // 블록의 face가 world border를 가리키는 경우 - 렌더링하지 않음
            // if (block === null) {
            //     continue;
            // }

            // 블록의 face가 다른 active 블록과 맞닿은 경우 - 렌더링하지 않음
            if (block?.active === true) {
                continue;
            }

            directions.push(direction);
        }

        return directions;
    }

    _getRenderInfos() {
        // 비활성화된 블록은 렌더링하지 않음
        if (this.active === false) {
            return null;
        }

        const blockRenderInfos = [];
        let hash = 0;

        const blockData = BlockData.filter((data) => data.id === this.id);
        let textures = [];

        if (blockData.length > 0) {
            const _texture = blockData[0].texture;

            if (_texture instanceof Array) {
                textures = _texture;
            } else {
                textures = Array(6).fill(_texture);
            }
        } else {
            textures = Array(6).fill(this.id);
        }

        for (let direction = 0; direction < 6; direction++) {
            const block = this.getNearBlock(direction);

            // 블록의 face가 world border를 가리키는 경우 - 렌더링하지 않음
            // if (block === null) {
            //     continue;
            // }

            // 블록의 face가 다른 active 블록과 맞닿은 경우 - 렌더링하지 않음
            if (block?.active === true) {
                continue;
            }

            // 블록 instance의 instanceMatrix를 계산
            // 행렬곱은 아래부터 위로 역순으로 적용

            const matrix = new THREE.Matrix4();
            const directionVector = Block.getDirectionVector(direction);

            // (3) block의 world coordinate로 translation
            matrix.multiply(
                new THREE.Matrix4().makeTranslation(this.coordinate)
            );

            // (2) block의 face의 위치로 translation
            matrix.multiply(
                new THREE.Matrix4().makeTranslation(
                    directionVector.multiplyScalar(0.5)
                )
            );

            // (1) block의 face의 방향으로 rotation
            switch (direction) {
                case Direction.Right:
                    matrix.multiply(new THREE.Matrix4().makeRotationY(PI_2));
                    break;
                case Direction.Left:
                    matrix.multiply(new THREE.Matrix4().makeRotationY(-PI_2));
                    break;
                case Direction.Up:
                    matrix.multiply(new THREE.Matrix4().makeRotationX(-PI_2));
                    break;
                case Direction.Down:
                    matrix.multiply(new THREE.Matrix4().makeRotationX(PI_2));
                    break;
                case Direction.Front:
                    break;
                case Direction.Back:
                    matrix.multiply(new THREE.Matrix4().makeRotationY(Math.PI));
                    break;
            }

            hash += 1 << direction;

            blockRenderInfos.push({
                // coordinate: this.coordinate,
                // direction: direction,

                // 렌더링에 필수적인 정보
                uvOffset: getUVOffset(textures[direction]),
                matrix: matrix,
            });
        }

        if (blockRenderInfos.length === 0) {
            return null;
        }

        return {
            hash: hash,
            infos: blockRenderInfos,
        };
    }
}
