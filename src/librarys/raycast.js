import * as THREE from "three";
import { getHalfDecimal } from "./util.js";
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
    const coordinate = new THREE.Vector3(point.x, point.y, point.z);

    let normal = null;
    let direction = null;

    if (axis === 0) {
        coordinate.x =
            rayDirection.x > 0 ? Math.ceil(point.x) : Math.floor(point.x);
        coordinate.y = Math.round(point.y);
        coordinate.z = Math.round(point.z);

        direction = rayDirection.x > 0 ? Direction.Left : Direction.Right;
    } else if (axis === 1) {
        coordinate.x = Math.round(point.x);
        coordinate.y =
            rayDirection.y > 0 ? Math.ceil(point.y) : Math.floor(point.y);
        coordinate.z = Math.round(point.z);

        direction = rayDirection.y > 0 ? Direction.Down : Direction.Up;
    } else if (axis === 2) {
        coordinate.x = Math.round(point.x);
        coordinate.y = Math.round(point.y);
        coordinate.z =
            rayDirection.z > 0 ? Math.ceil(point.z) : Math.floor(point.z);

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
 * @param {THREE.Vector3} position
 * @param {THREE.Vector3} direction
 */
export function raycast(position, direction, depth = 100) {
    const rx = direction.x;
    const ry = direction.y;
    const rz = direction.z;

    const px = position.x;
    const py = position.y;
    const pz = position.z;

    const rxSign = Math.sign(rx);
    const rySign = Math.sign(ry);
    const rzSign = Math.sign(rz);

    // direction의 방향에 따라 0.5로 올림 혹은 -0.5로 내림한 값
    const pxDecimal = getHalfDecimal(px, rxSign) - px;
    const pyDecimal = getHalfDecimal(py, rySign) - py;
    const pzDecimal = getHalfDecimal(pz, rzSign) - pz;

    // 각 x, y, z절편에서 다음 x, y, z 절편으로 가는 벡터
    const xVector = rx
        ? direction.clone().multiplyScalar(1 / Math.abs(rx))
        : null;
    const yVector = ry
        ? direction.clone().multiplyScalar(1 / Math.abs(ry))
        : null;
    const zVector = rz
        ? direction.clone().multiplyScalar(1 / Math.abs(rz))
        : null;

    // 양수 방향은 pxDecimal을, 음수 방향의 경우에는 -pxDecimal을 사용해야함
    // 그런데 음수 방향은 이미 xVector가 음수이므로 두 경우 모두 Math.abs(pxDecimal)을 사용
    const xSideDist = Math.abs(pxDecimal);
    const ySideDist = Math.abs(pyDecimal);
    const zSideDist = Math.abs(pzDecimal);

    // 현재 position에서 direction 방향의 ray가 처음으로 만나는 x, y, z절편으로 가는 벡터
    const xSideDistVector = rx
        ? xVector.clone().multiplyScalar(xSideDist)
        : null;
    const ySideDistVector = ry
        ? yVector.clone().multiplyScalar(ySideDist)
        : null;
    const zSideDistVector = rz
        ? zVector.clone().multiplyScalar(zSideDist)
        : null;

    // Ray가 처음으로 만나는 x, y, z절편의 좌표
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

    // intersects를 distance 순으로 정렬
    intersects.sort((a, b) => a.distance - b.distance);

    return intersects;
}
