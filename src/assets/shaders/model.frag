precision mediump float;

uniform vec3 lightDir;
uniform vec4 matAmbient, matDiffuse, matSpecular;
uniform float matShininess;

// uniform sampler2D diffuseMap, normalMap, emissiveMap, metalnessMap;

varying vec2 fTexCoord;
varying vec3 fNormal, fWorldPos;

void main() {
    // surface의 normal 벡터
    vec3 N = normalize(fNormal);

    // surface의 incident(light) 벡터
    vec3 L = normalize(lightDir);

    // surface의 view 벡터
    vec3 V = normalize(-fWorldPos);

    // surface의 halfway 벡터
    vec3 H = normalize(L + V);

    vec4 ambient = matAmbient;

    float kd = max(dot(N, L), 0.0);
    vec4 diffuse = kd * matDiffuse;

    float ks = pow(max(dot(N, H), 0.0), matShininess);
    vec4 specular = ks * matSpecular;

    vec4 phong = ambient + diffuse + specular;
    // vec4 baseColor = texture2D(diffuseMap, fTexCoord);
    // vec4 emissive = texture2D(emissiveMap, fTexCoord);

    // gl_FragColor = phong * baseColor;
    gl_FragColor = phong;
    
    // normal 디버그 코드
    // gl_FragColor = vec4(N * 0.5 + 0.5, 1.0);

    // tangent 디버그 코드
    // gl_FragColor = vec4(T * 0.5 + 0.5, 1.0);
}