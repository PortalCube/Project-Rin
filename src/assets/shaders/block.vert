precision highp float;

uniform float uvTileSize;

attribute vec2 uvOffset;
attribute float ambient;

varying vec3 fNormal, fWorldPos;
varying vec2 fTexCoord;
varying vec4 matAmbient;

void main() {
    vec4 worldPosition = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
    
    fWorldPos = worldPosition.xyz;
    fNormal = normalize(normalMatrix * normal);
    fTexCoord = (uv + uvOffset) / uvTileSize;
    matAmbient = vec4(ambient, ambient, ambient, 1.0);

    // uv로 vertex index를 계산 -- 언젠가 필요하면 사용
    int index = int(uv.x + uv.y * 2.0);

    gl_Position = projectionMatrix * worldPosition;
}