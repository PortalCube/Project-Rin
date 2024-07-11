import * as THREE from "three";
import { createEnum } from "../util.js";
import { LIQUID_SIZE, TILE_MAP_SIZE } from "../setting.js";

import BlockData from "../../assets/json/blocks.json";

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

export function getUVOffset(id, tileSize = TILE_MAP_SIZE) {
    const x = id % tileSize;
    const y = tileSize - Math.floor(id / tileSize) - 1;

    return [x, y];
}

export class Block {
    /**
     * @type {Chunk}
     */
    chunk = null;

    _id = 0;
    _active = false;
    _info = null;

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
        this._info =
            BlockData.filter((data) => data.id === this.id)?.[0] ?? null;
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

    get info() {
        return this._info;
    }

    get isLiquid() {
        return this._info?.liquid === true;
    }

    static get Direction() {
        return Direction;
    }

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
        // 공기가 아닌 복쉘 블록이 아니면, 렌더링 하지 않음
        if (this.id <= 0) {
            return null;
        }

        const blockRenderInfos = [];
        let hash = 0;

        let textures = [];
        let transparent = false;

        if (this.info) {
            const _texture = this.info.texture;
            transparent = this.info.transparent === true;

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

            // 블록의 face가 world border를 가리키는 경우
            // if (block === null) {
            //     // 렌더링하지 않음
            //     continue;
            // }

            // 블록의 face가 다른 복쉘 블록과 맞닿은 경우
            if (block?.id > 0) {
                // 맞닿은 블록이 transparent하지 않은 경우 렌더링 하지 않음
                if (block.info?.transparent !== true) {
                    continue;
                }

                // 맞닿은 블록이 transparent하더라도 동일 블록인 경우 렌더링 하지 않음
                if (block.id === this.id) {
                    continue;
                }
            }

            // 블럭이 조금 더 자연스럽게 보이도록 Z축 face의 앰비언트 라이트를 어둡게 지정
            let ambient = 1.0;
            if (direction === Direction.Front || direction === Direction.Back) {
                ambient = 0.85;
            }

            // 블록 instance의 instanceMatrix를 계산
            // 행렬곱은 아래부터 위로 역순으로 적용

            const matrix = new THREE.Matrix4();
            const directionVector = getDirectionVector(direction);

            // Translate

            // (4) block의 world coordinate로 translation
            matrix.multiply(
                new THREE.Matrix4().makeTranslation(this.coordinate)
            );

            if (this.info?.liquid) {
                // (3-A) 유체이고, 윗면 face는 (1 - LIQUID_SIZE) 만큼 아래로 내리기
                if (direction === Direction.Up) {
                    matrix.multiply(
                        new THREE.Matrix4().makeTranslation(
                            new THREE.Vector3(0, LIQUID_SIZE - 1, 0)
                        )
                    );
                }

                // (3-B) 유체이고, 옆면 face는 (1 - LIQUID_SIZE) / 2 만큼 아래로 내리기
                if (
                    direction === Direction.Right ||
                    direction === Direction.Left ||
                    direction === Direction.Front ||
                    direction === Direction.Back
                ) {
                    matrix.multiply(
                        new THREE.Matrix4().makeTranslation(
                            new THREE.Vector3(0, (LIQUID_SIZE - 1) / 2, 0)
                        )
                    );
                }
            }

            // (3) block의 face의 위치로 translation
            matrix.multiply(
                new THREE.Matrix4().makeTranslation(
                    directionVector.multiplyScalar(0.5)
                )
            );

            // Rotate

            // (2) block의 face의 방향으로 rotation
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

            // Scale

            if (this.info?.liquid) {
                // (1-A) 유체의 경우에는, X+, X-, Z+, Z- 방향의 face를 살짝 작게 만들기
                if (
                    direction === Direction.Right ||
                    direction === Direction.Left ||
                    direction === Direction.Front ||
                    direction === Direction.Back
                ) {
                    matrix.multiply(
                        new THREE.Matrix4().makeScale(1, LIQUID_SIZE, 1)
                    );
                }
            }

            hash += 1 << direction;

            blockRenderInfos.push({
                uvOffset: getUVOffset(textures[direction]),
                normal: directionVector,
                ambient: ambient,
                matrix: matrix,
                transparent: transparent,
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
