precision mediump float;

uniform sampler2D textureImage;
varying vec2 fTexCoord;

void main() {
    gl_FragColor = texture2D(textureImage, fTexCoord);
}