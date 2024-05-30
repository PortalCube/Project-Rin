/**
 * n을 m으로 나눈 나머지를 반환합니다. n이 음수인 경우도 양수로 반환합니다.
 * @param {number} n
 * @param {number} m
 * @returns {number} n mod m
 */
export function mod(n, m) {
    return ((n % m) + m) % m;
}

/**
 * world의 size를 받아와서 min, max 값을 반환합니다.
 * @param {number} size 월드 크기
 * @returns {number[]} [min, max]
 */
export function getMinMax(size) {
    if (typeof size !== "number" || size < 1) {
        return [null, null];
    }

    // half가 0인 경우 -half는 -0이 됨
    // +0을 붙이면 -0이 +0이 됨
    const half = Math.floor(--size / 2);
    return [-half + 0, half + (size % 2)];
}

/**
 * world 좌표를 chunk 인덱스로 변환합니다.
 * @param {number} value world 좌표
 * @param {number} chunkSize chunk 크기
 * @returns chunk 인덱스
 */
export function getChunkIndex(value, chunkSize) {
    const n = value + Math.floor((chunkSize - 1) / 2);
    return Math.floor(n / chunkSize);
}

/**
 * world 좌표를 chunk 좌표로 변환합니다.
 * @param {number} value world 좌표
 * @param {number} chunkSize chunk 크기
 * @returns chunk 좌표
 */
export function getChunkCoordinate(value, chunkSize) {
    const n = value + Math.floor((chunkSize - 1) / 2);
    return mod(n, chunkSize);
}
