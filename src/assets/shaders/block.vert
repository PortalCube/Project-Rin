varying vec2 fTexCoord;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    fTexCoord = uv;
}