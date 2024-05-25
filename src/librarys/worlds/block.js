export const BlockDirection = {
    UP: 0,
    DOWN: 1,
    LEFT: 2,
    RIGHT: 3,
    FRONT: 4,
    BACK: 5,
};

export class Block {
    id = 0;
    direction = BlockDirection.UP;

    constructor(id) {
        this.id = id;
    }
}
