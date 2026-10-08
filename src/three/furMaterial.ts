import * as THREE from 'three'

/**
 * Pelagem por "shell texturing": a mesma malha é desenhada N vezes (instâncias),
 * cada camada empurrada um pouco para fora ao longo da normal. No fragment shader
 * cada célula 3D vira um fio que afina até a ponta; o que não é fio é descartado.
 * Os fios curvam com gravidade, inércia do giro e com o "carinho" do ponteiro.
 */

export const KEY_DIR = new THREE.Vector3(2.4, 4, 3.6).normalize()
export const FILL_DIR = new THREE.Vector3(-3.2, 1.2, 2.2).normalize()
export const RIM_DIR = new THREE.Vector3(-0.6, 2.2, -4).normalize()

export function createFurUniforms() {
  return {
    uTime: { value: 0 },
    uShells: { value: 28 },
    uDensity: { value: 60 },
    uSpin: { value: 0 },
    uBounce: { value: 0 },
    uBrushStrength: { value: 0 },
    uColor0: { value: new THREE.Color('#6E4A33') },
    uColor1: { value: new THREE.Color('#EFE4D6') },
    uColor2: { value: new THREE.Color('#5A3A27') },
    uBlush: { value: new THREE.Color('#FFC2C6') },
    uKeyDir: { value: KEY_DIR.clone() },
    uFillDir: { value: FILL_DIR.clone() },
    uRimDir: { value: RIM_DIR.clone() },
    uKeyColor: { value: new THREE.Color('#fff0e0').multiplyScalar(1.05) },
    uFillColor: { value: new THREE.Color('#ffe4d6').multiplyScalar(0.42) },
    uRimColor: { value: new THREE.Color('#ffe0c0').multiplyScalar(0.55) },
    uSky: { value: new THREE.Color('#fff4e8').multiplyScalar(0.38) },
    uGround: { value: new THREE.Color('#8a6248').multiplyScalar(0.2) },
  }
}

export type FurUniforms = ReturnType<typeof createFurUniforms>

export interface PartUniforms extends FurUniforms {
  uBrushPos: { value: THREE.Vector3 }
  uBrushDir: { value: THREE.Vector3 }
}

const noise = /* glsl */ `
float hash13(vec3 p3) {
  p3 = fract(p3 * .1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}
vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(.1031, .1030, .0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yxx) * p3.zyx);
}
float vnoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x), mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x), mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
`

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uShells;
uniform float uSpin;
uniform float uBounce;
uniform vec3 uBrushPos;
uniform vec3 uBrushDir;
uniform float uBrushStrength;

attribute float furLen;
attribute float slot;
attribute float tint;

varying vec3 vBase;
varying vec3 vNObj;
varying vec3 vNWorld;
varying vec3 vWorldPos;
varying float vH;
varying float vSlot;
varying float vClump;
varying float vTint;

${noise}

void main() {
#ifdef BASE
  float h = 0.0;
#else
  float h = (float(gl_InstanceID) + 1.0) / uShells;
#endif
  vec3 n = normalize(normal);
  vec3 p = position;

  float clump = vnoise(p * 7.0);
  float L = furLen * mix(0.8, 1.15, clump);
  float bend = h * h;

  vec3 disp = n * L * h;

  // gravidade, quique e inércia do giro: os fios "atrasam" em relação ao movimento
  vec3 force = vec3(0.0, -0.5 - uBounce, 0.0);
  force += vec3(-uSpin * p.z, 0.0, uSpin * p.x) * 0.16;
  force -= n * dot(force, n);
  disp += force * L * bend;

  // carinho: perto do ponteiro os fios deitam e seguem a direção do gesto
  float infl = uBrushStrength * (1.0 - smoothstep(0.0, 0.5, distance(p, uBrushPos)));
  vec3 comb = uBrushDir - n * dot(uBrushDir, n);
  disp += comb * L * bend * infl * 2.4;
  disp -= n * L * h * infl * 0.4;

  // brisa bem sutil
  disp += vec3(sin(uTime * 1.7 + p.y * 9.0 + p.x * 3.0), 0.0, cos(uTime * 1.3 + p.x * 8.0)) * L * bend * 0.12;

  vec4 world = modelMatrix * vec4(p + disp, 1.0);
  vWorldPos = world.xyz;
  vNWorld = normalize(mat3(modelMatrix) * n);
  vBase = p;
  vNObj = n;
  vH = h;
  vSlot = slot;
  vClump = clump;
  vTint = tint;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const fragmentShader = /* glsl */ `
uniform float uDensity;
uniform vec3 uColor0;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uBlush;
uniform vec3 uKeyDir;
uniform vec3 uFillDir;
uniform vec3 uRimDir;
uniform vec3 uKeyColor;
uniform vec3 uFillColor;
uniform vec3 uRimColor;
uniform vec3 uSky;
uniform vec3 uGround;

varying vec3 vBase;
varying vec3 vNObj;
varying vec3 vNWorld;
varying vec3 vWorldPos;
varying float vH;
varying float vSlot;
varying float vClump;
varying float vTint;

${noise}

void main() {
  // grade dos fios girada para não alinhar com os eixos (evita aspecto de trama)
  const mat3 ROT = mat3(0.8, 0.36, -0.48, -0.6, 0.48, -0.64, 0.0, 0.8, 0.6);
  vec3 n = ROT * normalize(vNObj);
  // focinho e patas têm pelo mais curto e mais fino
  float density = uDensity * (vSlot > 0.5 ? 1.15 : 1.0);
  vec3 q = ROT * vBase * density;
  vec3 cell = floor(q);
  vec3 rnd = hash33(cell);
  vec3 f = fract(q) - (0.5 + (rnd - 0.5) * 0.55);
  f -= n * dot(f, n);
  float r = length(f) * 2.0;

  float strandLen = mix(0.55, 1.0, rnd.x);
  float t = vH / strandLen;
  float alpha = 1.0;
#ifndef BASE
  if (t > 1.0) discard;
  float radius = 1.05 * (1.0 - t * 0.85);
  if (r > radius * 0.85) discard;
#endif

  vec3 base = vSlot < 0.5 ? uColor0 : (vSlot < 1.5 ? uColor1 : uColor2);
  base *= mix(0.93, 1.06, rnd.y) * mix(0.86, 1.08, vClump);
  // bochechas: o pelo puxa para o rosado, mais forte nas pontas
  base = mix(base, uBlush, vTint * mix(0.18, 0.42, vH));
  base = mix(base, base * 1.2 + 0.012, smoothstep(0.45, 1.0, t));

  vec3 N = normalize(vNWorld);
  vec3 V = normalize(cameraPosition - vWorldPos);
  float ao = mix(0.46, 1.0, pow(clamp(vH, 0.0, 1.0), 0.7));
  float wrap = 0.5;
  float kd = max((dot(N, uKeyDir) + wrap) / (1.0 + wrap), 0.0);
  float fd = max((dot(N, uFillDir) + wrap) / (1.0 + wrap), 0.0);
  vec3 hemi = mix(uGround, uSky, N.y * 0.5 + 0.5);
  vec3 col = base * (hemi + kd * uKeyColor + fd * uFillColor) * ao;

  // brilho de fio (Kajiya-Kay aproximado: a tangente do fio ~ normal)
  vec3 H = normalize(uKeyDir + V);
  float th = dot(N, H);
  col += uKeyColor * pow(sqrt(max(1.0 - th * th, 0.0)), 48.0) * 0.05 * vH;

  // contorno aveludado
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  float back = max(dot(N, uRimDir), 0.0) * 0.5 + 0.5;
  col += uRimColor * rim * back * ao;

  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export function createFurMaterial(uniforms: PartUniforms, base: boolean) {
  const m = new THREE.ShaderMaterial({
    uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
    vertexShader,
    fragmentShader,
    defines: base ? { BASE: '' } : {},
  })
  return m
}
