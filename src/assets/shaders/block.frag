precision highp float;

uniform vec3 lightDir;
uniform vec4 lightAmbient;
uniform vec4 matDiffuse, matSpecular;
uniform float matShininess;

varying vec3 fNormal, fWorldPos;
varying vec2 fTexCoord;
varying vec4 matAmbient;

uniform sampler2D textureImage;

void main() {
    // surface의 normal 벡터
    vec3 N = normalize(fNormal);

    // surface의 light 벡터
    vec3 L = normalize(lightDir);

    // surface의 reflect 벡터
    // reflect(L, N) -> 2.0 * dot(L, N) * N - L
    vec3 R = reflect(-L, N);

    // surface의 view 벡터
    vec3 V = normalize(-fWorldPos);

    // surface의 halfway 벡터
    vec3 H = normalize(L + V);

    // ambient
    vec4 ambient = lightAmbient * matAmbient;

    // diffuse
    float kd = max(dot(N, L), 0.0);
    vec4 diffuse = kd * matDiffuse;

    // specular
    float ks = pow(max(dot(N, H), 0.0), matShininess);
    vec4 specular = ks * matSpecular;

    // phong & textureMap
    vec4 phong = ambient + diffuse;
    vec4 textureMap = texture2D(textureImage, fTexCoord);

    specular.w *= textureMap.w;

    // fragment color는 phong과 textureMap을 곱하여 적용
    gl_FragColor = phong * textureMap + specular;

    // normal 디버그 코드
    // gl_FragColor = vec4(N * 0.5 + 0.5, 1.0);

    // uv 디버그 코드
    // gl_FragColor = vec4(fTexCoord.x, fTexCoord.y, 0.0, 1.0);

    // ambient + texture map debug
    // gl_FragColor = ambient * textureMap;
}