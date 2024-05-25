import { Block } from "./block.js";

export const CHUNK_SIZE = 16;

export class Chunk {
    blocks = [];

    constructor(depth) {
        this.blocks = new Array(CHUNK_SIZE * CHUNK_SIZE * depth).fill(
            new Block(0)
        );
    }
}
