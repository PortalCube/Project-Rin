precision mediump float;

// varying vec2 fTexCoord;
varying vec3 fNormal, fWorldPos;

void main() {
    vec4 worldPosition = modelViewMatrix * vec4(position, 1.0);

    fNormal = normalize(normalMatrix * normal);
    fWorldPos = worldPosition.xyz;
    // fTexCoord = uv;

    gl_Position = projectionMatrix * worldPosition;
}