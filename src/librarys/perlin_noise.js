import { getDecimal } from "./util.js";

function getConstantVector(v) {
    const i = v % 4;

    const vectors = [
        [1.0, 1.0],
        [-1.0, 1.0],
        [-1.0, -1.0],
        [1.0, -1.0],
    ];

    return vectors[i];
}

function getConstantVector3D(v) {
    const i = v % 8;

    const vectors = [
        [1.0, 1.0, 0.0],
        [-1.0, 1.0, 0.0],
        [-1.0, -1.0, 0.0],
        [1.0, -1.0, 0.0],
        [1.0, 0.0, 1.0],
        [-1.0, 0.0, 1.0],
        [-1.0, 0.0, -1.0],
        [1.0, 0.0, -1.0],
    ];

    return vectors[i];
}

function fade(t) {
    return ((6 * t - 15) * t + 10) * t * t * t;
}

function lerp(t, a1, a2) {
    return a1 + t * (a2 - a1);
}

function dot(v1, v2) {
    return v1[0] * v2[0] + v1[1] * v2[1];
}

function createPermutationTable() {
    const permutation = [];

    // 0 ~ 255의 숫자를 permutation 배열에 삽입
    for (let i = 0; i < 256; i++) {
        permutation.push(i);
    }

    // permutation 배열을 shuffle
    for (let i = permutation.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
    }

    // permutation 배열을 두 번 이어붙임
    permutation.push(...permutation);

    // 배열을 반환
    return permutation;
}

const P = createPermutationTable();

export function getPerlinNoise(x, y) {
    const _x = Math.floor(x) % 256;
    const _y = Math.floor(y) % 256;

    const xf = getDecimal(x);
    const yf = getDecimal(y);

    const topRight = [xf - 1.0, yf - 1.0];
    const topLeft = [xf - 0.0, yf - 1.0];
    const bottomRight = [xf - 1.0, yf - 0.0];
    const bottomLeft = [xf - 0.0, yf - 0.0];

    const topRightValue = P[P[_x + 1] + _y + 1];
    const topLeftValue = P[P[_x + 0] + _y + 1];
    const bottomRightValue = P[P[_x + 1] + _y + 0];
    const bottomLeftValue = P[P[_x + 0] + _y + 0];

    const topRightVector = getConstantVector(topRightValue);
    const topLeftVector = getConstantVector(topLeftValue);
    const bottomRightVector = getConstantVector(bottomRightValue);
    const bottomLeftVector = getConstantVector(bottomLeftValue);

    const topRightDot = dot(topRight, topRightVector);
    const topLeftDot = dot(topLeft, topLeftVector);
    const bottomRightDot = dot(bottomRight, bottomRightVector);
    const bottomLeftDot = dot(bottomLeft, bottomLeftVector);

    const u = fade(xf);
    const v = fade(yf);

    const x1 = lerp(v, bottomLeftDot, topLeftDot);
    const x2 = lerp(v, bottomRightDot, topRightDot);

    return lerp(u, x1, x2);
}

export function getFractalBrownianMotion(
    x,
    y,
    octaves = 8,
    amplitude = 1,
    frequency = 0.01
) {
    let sum = 0;

    for (let octave = 0; octave < octaves; octave++) {
        // perlinNoise 값에 진폭을 곱해서 더하기
        sum += amplitude * getPerlinNoise(x * frequency, y * frequency);

        // 진폭을 절반으로
        amplitude /= 2;

        // 주파수를 두 배로
        frequency *= 2;
    }

    return sum;
}

export function create2DNoiseFunction(options) {
    const {
        min,
        max,
        shiftX = 0,
        shiftY = 0,
        octaves = 8,
        amplitude = 1,
        frequency = 0.01,
    } = options;

    const minNoise = -Math.sqrt(2);
    const maxNoise = Math.sqrt(2);

    return (x, y) => {
        const value = getFractalBrownianMotion(
            x + shiftX,
            y + shiftY,
            octaves,
            amplitude,
            frequency
        );
        const normalized = (value - minNoise) / (maxNoise - minNoise);

        return min + (max - min) * normalized;
    };
}
