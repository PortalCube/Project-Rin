import * as THREE from "three";
import { createEnum, randomRange } from "../util.js";

//prettier-ignore
export const Direction = createEnum({
    Right: 0, // X+
    Left:  1, // X-
    Up:    2, // Y+
    Down:  3, // Y-
    Front: 4, // Z+
    Back:  5, // Z-
});

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
        if (value === 2) {
            this._id = randomRange(1, 8);
        } else {
            this._id = value;
        }

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
     * @returns {object[]} 렌더링 정보
     */
    getRenderInfos() {
        const infos = [];

        // 비활성화된 블록은 렌더링하지 않음
        if (this.active === false) {
            return [];
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

            infos.push({
                coordinate: this.coordinate,
                direction: direction,

                // TODO: block id에 따라 각 direction face별로 다른 텍스쳐 사용
                texture: this.id,
            });
        }

        return infos;
    }
}
