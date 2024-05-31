import * as THREE from "three";
import { createEnum } from "../util.js";
import blockVertexShader from "../../assets/shaders/block.vert?raw";
import blockFragmentShader from "../../assets/shaders/block.frag?raw";
import diamond from "../../assets/textures/diamond.bmp";
import { RinEngine } from "../engine.js";
import { Chunk } from "./chunk.js";

//prettier-ignore
export const Direction = createEnum({
    Right: 0, // X+
    Left:  1, // X-
    Up:    2, // Y+
    Down:  3, // Y-
    Front: 4, // Z+
    Back:  5, // Z-
});

function getDirectionVector(direction) {
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

function getNearBlock(chunk, coordinate, direction) {
    const world = chunk.world;
    const directionVector = getDirectionVector(direction);
    const targetCoordinate = coordinate.clone().add(directionVector);

    const x = targetCoordinate.x;
    const y = targetCoordinate.y;
    const z = targetCoordinate.z;

    return world.getBlock(x, y, z);
}

function getUVCoordinate(id, tileSize = 16) {
    const size = 1 / tileSize;
    const x = (id % tileSize) * size;
    const y = (tileSize - Math.floor(id / tileSize) - 1) * size;

    const arr = [];

    for (let i = 0; i < 6; i++) {
        arr.push(x, y + size, x + size, y + size, x, y, x + size, y);
    }

    return arr;
}

export class Block {
    /**
     * @type {Chunk}
     */
    chunk = null;

    id = 0;

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

    static get Direction() {
        return Direction;
    }

    constructor(
        chunk,
        id = 0,
        coordinate = new THREE.Vector3(0, 0, 0),
        direction = Direction.Up
    ) {
        this.chunk = chunk;
        this.id = id;
        this.coordinate = coordinate;
        this.direction = direction;
    }

    setId(id) {
        this.id = id;

        if (this.instance) {
            const uvs = getUVCoordinate(this.id, 16);
            this.geometry.setAttribute(
                "uv",
                new THREE.Float32BufferAttribute(uvs, 2)
            );
        }
    }

    load() {
        this.geometry = new THREE.BoxGeometry();
        const originalIndices = this.geometry.getIndex().array;
        const indices = [];

        for (let i = 0; i < 6; i++) {
            const nearBlock = getNearBlock(this.chunk, this.coordinate, i);

            if (nearBlock !== null) {
                if (nearBlock.id !== 0) {
                    continue;
                }
            }

            for (let j = 0; j < 6; j++) {
                indices.push(originalIndices[i * 6 + j]);
            }
        }

        if (indices.length === 0) {
            return null;
        }

        this.geometry.setIndex(indices);

        const uvs = getUVCoordinate(this.id, 16);
        this.geometry.setAttribute(
            "uv",
            new THREE.Float32BufferAttribute(uvs, 2)
        );

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                textureImage: {
                    value: RinEngine.texture,
                },
            },
            vertexShader: blockVertexShader,
            fragmentShader: blockFragmentShader,
        });

        this.instance = new THREE.Mesh(this.geometry, this.material);
        this.instance.position.add(this.coordinate);

        return this.instance;
    }

    unload() {}
}
