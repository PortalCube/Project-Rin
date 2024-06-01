import * as THREE from "three";
import { getDecimal } from "./util.js";
import { Direction, getDirectionVector } from "./worlds/block.js";

// three.js에도 Raycaster가 구현되어 있지만, three.js의 Raycaster를 적용하면 Scene에 블록이 너무 많을때 성능이 급격히 떨어지는 이슈가 있었습니다.
// world의 블록 데이터로 간단한 레이캐스트를 수행함으로서 불필요한 연산을 줄여 레이캐스트의 성능을 최적화했습니다.

/**
 * Intersect 정보를 반환합니다.
 * @param {THREE.Vector3} origin
 * @param {THREE.Vector3} point
 * @param {THREE.Vector3} direction
 * @param {number} axis x: 0, y: 1, z: 2
 */
function getIntersectInfo(point, origin, rayDirection, axis) {
    const distance = origin.distanceTo(point);
    const coordinate = new THREE.Vector3(point.x, point.y, point.z).round();

    let normal = null;
    let direction = null;

    if (axis === 0) {
        direction = rayDirection.x > 0 ? Direction.Left : Direction.Right;
    } else if (axis === 1) {
        direction = rayDirection.y > 0 ? Direction.Down : Direction.Up;
    } else if (axis === 2) {
        direction = rayDirection.z > 0 ? Direction.Back : Direction.Front;
    }

    if (direction) {
        normal = getDirectionVector(direction);
    }

    return {
        point,
        distance,
        coordinate,
        normal,
    };
}

/**
 * Raycast를 수행합니다.
 * @param {World} world
 * @param {THREE.Vector3} position
 * @param {THREE.Vector3} direction
 */
export function raycast(world, position, direction, depth = 30) {
    const rx = direction.x;
    const ry = direction.y;
    const rz = direction.z;

    const px = position.x;
    const py = position.y;
    const pz = position.z;

    const pxDecimal = getDecimal(px);
    const pyDecimal = getDecimal(py);
    const pzDecimal = getDecimal(pz);

    const xVector = rx
        ? direction.clone().multiplyScalar(1 / Math.abs(rx))
        : null;
    const yVector = ry
        ? direction.clone().multiplyScalar(1 / Math.abs(ry))
        : null;
    const zVector = rz
        ? direction.clone().multiplyScalar(1 / Math.abs(rz))
        : null;

    const xSideDist = rx > 0 ? 1 - pxDecimal : pxDecimal;
    const ySideDist = ry > 0 ? 1 - pyDecimal : pyDecimal;
    const zSideDist = rz > 0 ? 1 - pzDecimal : pzDecimal;

    const xSideDistVector = rx
        ? xVector.clone().multiplyScalar(xSideDist)
        : null;
    const ySideDistVector = ry
        ? yVector.clone().multiplyScalar(ySideDist)
        : null;
    const zSideDistVector = rz
        ? zVector.clone().multiplyScalar(zSideDist)
        : null;

    const xPoint = xSideDistVector
        ? position.clone().add(xSideDistVector)
        : null;
    const yPoint = ySideDistVector
        ? position.clone().add(ySideDistVector)
        : null;
    const zPoint = zSideDistVector
        ? position.clone().add(zSideDistVector)
        : null;

    const intersects = [];

    if (xPoint) {
        intersects.push(getIntersectInfo(xPoint, position, direction, 0));

        let latestPoint = xPoint;

        for (let i = 0; i < depth - 1; i++) {
            latestPoint = latestPoint.clone().add(xVector);
            intersects.push(
                getIntersectInfo(latestPoint, position, direction, 0)
            );
        }
    }

    if (yPoint) {
        intersects.push(getIntersectInfo(yPoint, position, direction, 1));

        let latestPoint = yPoint;

        for (let i = 0; i < depth - 1; i++) {
            latestPoint = latestPoint.clone().add(yVector);
            intersects.push(
                getIntersectInfo(latestPoint, position, direction, 1)
            );
        }
    }

    if (zPoint) {
        intersects.push(getIntersectInfo(zPoint, position, direction, 2));
        let latestPoint = zPoint;

        for (let i = 0; i < depth - 1; i++) {
            latestPoint = latestPoint.clone().add(zVector);
            intersects.push(
                getIntersectInfo(latestPoint, position, direction, 2)
            );
        }
    }

    intersects.sort((a, b) => a.distance - b.distance);

    for (const intersect of intersects) {
        const x = intersect.coordinate.x;
        const y = intersect.coordinate.y;
        const z = intersect.coordinate.z;

        const block = world.getBlock(x, y, z);

        if (block && block.active) {
            return intersect;
        }
    }

    return null;
}
