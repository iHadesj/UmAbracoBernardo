import * as THREE from 'three'

/**
 * Pelagem por "shell texturing": a mesma malha é desenhada N vezes (instâncias),
 * cada camada empurrada um pouco para fora ao longo da normal. No fragment shader
 * cada célula 3D vira um fio que afina até a ponta; o que não é fio é descartado.
 * Os fios se juntam em tufos (como pelúcia de verdade), deitam com a gravidade,
 * atrasam com a inércia do giro e se abrem com o "carinho" do ponteiro.
 */

export const KEY_DIR = new THREE.Vector3(2.4, 4, 3.6).normalize()
export const FILL_DIR = new THREE.Vector3(-3.2, 1.2, 2.2).normalize()
export const RIM_DIR = new THREE.Vector3(-0.6, 2.2, -4).normalize()

export function createFurUniforms() {
  return {
    uTime: { value: 0 },
    uShells: { value: 28 },
    // fios por unidade: mais baixo = fio mais grosso (acima de ~80 o fio some e vira chiado)
    uDensity: { value: 66 },
    // mechas: tamanho (em fios), quanto as pontas convergem e o vão que abre entre elas no alto
    uTuft: { value: 3.4 },
    uClump: { value: 0.48 },
    uGap: { value: 0.62 },
    // espessura do fio na ponta (1 = igual à base); ponta fina demais parece espinho
    uTip: { value: 0.42 },
    // quanto o pelo deita para baixo e quanto cada região é penteada para um lado
    uGravity: { value: 0.65 },
    uShag: { value: 0.5 },
    uSpin: { value: 0 },
    uBounce: { value: 0 },
    uBrushStrength: { value: 0 },
    uColor0: { value: new THREE.Color('#5D3A26') },
    uColor1: { value: new THREE.Color('#F5E6D3') },
    uColor2: { value: new THREE.Color('#E8C8A0') },
    uBlush: { value: new THREE.Color('#E8A0A0') },
    uKeyDir: { value: KEY_DIR.clone() },
    uFillDir: { value: FILL_DIR.clone() },
    uRimDir: { value: RIM_DIR.clone() },
    uKeyColor: { value: new THREE.Color('#fff0e0').multiplyScalar(1.12) },
    uFillColor: { value: new THREE.Color('#ffe4d6').multiplyScalar(0.45) },
    uRimColor: { value: new THREE.Color('#ffe0c0').multiplyScalar(0.55) },
    uSky: { value: new THREE.Color('#fff4e8').multiplyScalar(0.46) },
    uGround: { value: new THREE.Color('#8a6248').multiplyScalar(0.24) },
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
uniform float uShag;
uniform float uGravity;

attribute float furLen;
attribute float slot;
attribute float tint;
attribute float occ;
// ruído pré-calculado por vértice (bearGeometry): poupa o shader de calcular a cada camada
attribute float clump;
attribute vec3 shag;

varying vec3 vBase;
varying vec3 vNObj;
varying vec3 vNWorld;
varying vec3 vTWorld;
varying vec3 vWorldPos;
varying float vH;
varying float vSlot;
varying float vClump;
varying float vTint;
varying float vOcc;

void main() {
#ifdef BASE
  float h = 0.0;
#else
  float h = (float(gl_InstanceID) + 1.0) / uShells;
#endif
  vec3 n = normalize(normal);
  vec3 p = position;

  float L = furLen * mix(0.82, 1.22, clump);
  float bend = h * h;

  // gravidade, quique e inércia do giro: os fios "atrasam" em relação ao movimento;
  // e a pelúcia meio desgrenhada, cada região penteada para um lado
  vec3 lean = vec3(0.0, -uGravity - uBounce, 0.0) + shag * uShag;
  lean += vec3(-uSpin * p.z, 0.0, uSpin * p.x) * 0.18;

  // carinho: perto do ponteiro os fios deitam e seguem a direção do gesto
  float infl = uBrushStrength * (1.0 - smoothstep(0.0, 0.55, distance(p, uBrushPos)));
  lean += uBrushDir * infl * 2.6;

  // brisa bem sutil
  lean += vec3(sin(uTime * 1.5 + p.y * 8.5 + p.x * 2.8), 0.0, cos(uTime * 1.2 + p.x * 7.5)) * 0.14;
  lean -= n * dot(lean, n);

  float up = 1.0 - infl * 0.35;
  vec3 disp = n * L * h * up + lean * L * bend;
  // direção do fio nessa altura (derivada do deslocamento): usada no brilho
  vec3 strandDir = n * up + lean * 2.0 * h;

  vec4 world = modelMatrix * vec4(p + disp, 1.0);
  vWorldPos = world.xyz;
  vNWorld = normalize(mat3(modelMatrix) * n);
  vTWorld = normalize(mat3(modelMatrix) * strandDir);
  vBase = p;
  vNObj = n;
  vH = h;
  vSlot = slot;
  vClump = clump;
  vTint = tint;
  vOcc = occ;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const fragmentShader = /* glsl */ `
uniform float uDensity;
uniform float uClump;
uniform float uTuft;
uniform float uTip;
uniform float uGap;
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
varying vec3 vTWorld;
varying vec3 vWorldPos;
varying float vH;
varying float vSlot;
varying float vClump;
varying float vTint;
varying float vOcc;

${noise}

void main() {
  // grade dos fios girada para não alinhar com os eixos (evita aspecto de trama)
  const mat3 ROT = mat3(0.8, 0.36, -0.48, -0.6, 0.48, -0.64, 0.0, 0.8, 0.6);
  vec3 n = ROT * normalize(vNObj);
  // focinho, solas (1) e orelha por dentro (-1): pelo curto e fechado, como veludo
  float shortPile = step(0.5, abs(vSlot));
  vec3 q = ROT * vBase * (uDensity * mix(1.0, 1.9, shortPile));

  // tufos: a borda ondula para não formar uma grade de ladrilhos
  vec3 w = sin(q.yzx * 0.21 + vec3(1.7, 4.1, 2.3)) * 0.32;
  vec3 tid = floor(q / uTuft + w);
  vec3 tr = hash33(tid + 17.17);
  vec3 d = q - (tid + 0.5 + (tr - 0.5) * 0.4 - w) * uTuft;
  d -= n * dot(d, n);
  // a ponta de cada fio é puxada para o centro do tufo: acha a raiz do fio que passa aqui
  float pull = uClump * (1.0 - shortPile * 0.85) * pow(vH, 1.15) * mix(0.6, 1.0, tr.z);
  vec3 r = q + d * (pull / (1.0 - pull));
  // distância da raiz até o centro do tufo (0 no meio, ~0.5 na borda)
  float edge = length(d) / ((1.0 - pull) * uTuft);

  vec3 cell = floor(r);
  vec3 rnd = hash33(cell);
  vec3 f = fract(r) - (0.5 + (rnd - 0.5) * 0.36);
  f -= n * dot(f, n);
  float dist = length(f) * 2.0;

  // fios da borda do tufo são mais curtos: o tufo fica arredondado
  float strandLen = mix(0.55, 1.0, rnd.x) * mix(1.0, 0.78, smoothstep(0.25, 0.6, edge));
  float t = vH / strandLen;
#ifndef BASE
  if (t > 1.0) discard;
  // dentro da mecha os fios ficam encostados e só afinam perto da ponta;
  // na borda da mecha eles soltam um pouco, deixando o contorno felpudo
  float radius = mix(1.05, uTip, t * t) * mix(1.0, 0.78, smoothstep(0.2, 0.55, edge) * (1.0 - shortPile)) * mix(0.86, 1.1, rnd.z);
  if (dist > radius) discard;
  // vão entre tufos: abre conforme sobe
  if (edge > mix(0.98, uGap, vH)) discard;
#endif

  vec3 base = vSlot < -0.5 ? uColor2 : (vSlot < 0.5 ? uColor0 : uColor1);
  base *= mix(0.9, 1.08, rnd.y) * mix(0.9, 1.1, tr.y) * mix(0.92, 1.06, vClump);
  // bochechas: só um calor rosado, sem cara de maquiagem
  base = mix(base, uBlush, vTint * mix(0.05, 0.13, vH));
  // pontas mais claras e menos saturadas, como pelúcia escovada
  vec3 tipCol = mix(base, vec3(dot(base, vec3(0.3, 0.59, 0.11))), 0.3) * 1.32 + 0.025;
  base = mix(base, tipCol, smoothstep(0.45, 1.0, t));

  vec3 N = normalize(vNWorld);
  vec3 T = normalize(vTWorld);
  vec3 V = normalize(cameraPosition - vWorldPos);
  // escuro na raiz, no fundo entre tufos e onde uma parte encosta na outra
  float ao = mix(0.38, 1.0, pow(clamp(vH, 0.0, 1.0), 0.6));
  ao *= mix(1.0, 0.72, smoothstep(0.3, 0.6, edge) * (1.0 - vH) * (1.0 - shortPile));
  ao *= mix(0.86, 1.0, smoothstep(0.0, 0.35, t));
  ao *= vOcc;

  float wrap = 0.52;
  float kd = max((dot(N, uKeyDir) + wrap) / (1.0 + wrap), 0.0);
  float fd = max((dot(N, uFillDir) + wrap) / (1.0 + wrap), 0.0);
  vec3 hemi = mix(uGround, uSky, N.y * 0.5 + 0.5);
  vec3 col = base * (hemi + kd * uKeyColor + fd * uFillColor) * ao;

  // brilho anisotrópico ao longo do fio (Kajiya-Kay), mais forte nas pontas
  vec3 H = normalize(uKeyDir + V);
  float th = dot(T, H);
  float spec = pow(sqrt(max(1.0 - th * th, 0.0)), 34.0);
  col += (uKeyColor * 0.35 + base * 0.9) * spec * 0.11 * smoothstep(0.15, 1.0, vH) * kd * vOcc;

  // contorno aveludado: a luz de trás atravessa as pontas
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  float back = max(dot(N, uRimDir), 0.0) * 0.5 + 0.5;
  col += uRimColor * rim * back * ao * mix(0.55, 1.0, t);

  gl_FragColor = vec4(col, 1.0);
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
