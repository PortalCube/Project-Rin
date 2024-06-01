precision mediump float;

attribute vec2 uvOffset;
varying vec2 fTexCoord;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    fTexCoord = uv + uvOffset;
}