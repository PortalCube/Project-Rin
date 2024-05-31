precision mediump float;

varying vec2 fTexCoord;
uniform sampler2D textureImage;

void main() {
    gl_FragColor = texture2D(textureImage, fTexCoord);
    gl_FragColor.a = 1.0;
}