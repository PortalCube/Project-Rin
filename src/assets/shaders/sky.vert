precision mediump float;

uniform vec3 topColor;
uniform vec3 bottomColor;
varying vec4 fColor;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    // z를 w로 설정 (camera far에 render)
    gl_Position.z = gl_Position.w;

    vec4 vTopColor = vec4(topColor, 1.0);
    vec4 vBottomColor = vec4(bottomColor, 1.0);

    float y = clamp(position.y + 0.75, 0.0, 1.0);

    fColor = mix(vBottomColor, vTopColor, y);
}