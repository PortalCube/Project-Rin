import { Vector3 } from "three";

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

    /**
     * @type {Vector3}
     */
    coordinate = null;
    direction = null;

    constructor(
        id,
        coordinate = new Vector3(0, 0, 0),
        direction = BlockDirection.UP
    ) {
        this.id = id;
        this.coordinate = coordinate;
        this.direction = direction;
    }
}
