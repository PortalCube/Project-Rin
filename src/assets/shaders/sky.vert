precision mediump float;

uniform vec3 topColor;
uniform vec3 bottomColor;
varying vec4 fColor;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    // z를 1000으로 지정하여 camera far plane에 rendering 되도록 함
    gl_Position.z = gl_Position.w;

    vec4 vTopColor = vec4(topColor, 1.0);
    vec4 vBottomColor = vec4(bottomColor, 1.0);

    float y = clamp(position.y + 0.33, 0.0, 1.0);

    fColor = mix(vBottomColor, vTopColor, y);
}