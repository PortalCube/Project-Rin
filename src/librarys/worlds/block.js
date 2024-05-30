import { Vector3 } from "three";
import { createEnum } from "../util.js";

export const Direction = createEnum({
    UP: 0,
    DOWN: 1,
    LEFT: 2,
    RIGHT: 3,
    FRONT: 4,
    BACK: 5,
});

export class Block {
    id = 0;

    /**
     * @type {Vector3}
     */
    coordinate = null;
    direction = null;

    static get Direction() {
        return Direction;
    }

    constructor(
        id,
        coordinate = new Vector3(0, 0, 0),
        direction = Direction.UP
    ) {
        this.id = id;
        this.coordinate = coordinate;
        this.direction = direction;
    }
}
