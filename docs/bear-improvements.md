# Plano de Melhorias do Urso 3D

> Última atualização: 2026-10-10

---

## 📊 Estado Atual

| Área | Implementação | Qualidade |
|------|--------------|-----------|
| **Geometria** | Elipsoides procedurais (corpo, cabeça, focinho, pernas, braços, orelhas) | Boa base, mas "genérica" |
| **Pelagem** | Shell texturing (28-32 camadas) + shaders customizados | Boa, mas pode ser mais realista/performática |
| **Animações** | 5 gestos (wave, hug, hop, tilt, ears) + idle aleatório + respiração | Funcional, mas repetitivo |
| **Interação** | Carinho (brush) + tap (hug) + head follow pointer | Básica |
| **Expressividade** | Piscadas + olhos apertados no abraço | Limitada |
| **Acessórios** | Laço fixo + coleira + almofadinhas nas patas | Estático |

---

## 🎯 Plano de Melhorias

### **P1 — Visual & Realismo (Alto impacto)**

| # | Melhoria | Arquivos | Esforço | Status |
|---|----------|----------|---------|--------|
| 1.1 | **Pelagem mais fofa/volumosa** — ajustar `uDensity`, `furLen` por parte, noise 3D mais orgânico | `furMaterial.ts`, `bearGeometry.ts` | Médio | ✅ Concluído |
| 1.2 | **Subsurface scattering (SSS) leve** no shader — pelúcia transmite luz nas pontas | `furMaterial.ts` | Médio | ⏳ Pendente |
| 1.3 | **Variação de cor por parte** — corpo mais escuro, barriga/focinho mais claros, orelhas internas rosadas | `bearGeometry.ts` (slot/tint), `PlushBear.tsx` (uniforms) | Baixo | ✅ Concluído |
| 1.4 | **Olhos mais expressivos** — íris sutil, pupilas que dilatam, brilho anatômico (catchlight dinâmico) | `PlushBear.tsx` (mats.eye/shine) | Baixo | ✅ Concluído |
| 1.5 | **Nariz úmido/brilhante** — clearcoat anisotrópico, reflexo de ambiente | `PlushBear.tsx` (mats.nose) | Baixo | ✅ Concluído |

### **P2 — Personalidade & Animação (Alto impacto percebido)**

| # | Melhoria | Arquivos | Esforço | Status |
|---|----------|----------|---------|--------|
| 2.1 | **Novos gestos** — "peek" (esconde rosto), "sleep" (dorme se idle > 15s), "curious" (inclina cabeça lado a lado), "shy" (orelhas para baixo) | `PlushBear.tsx` (gestures, DURATION, IDLE_GESTURES) | Médio | ✅ Concluído |
| 2.2 | **Transições suaves entre gestos** — blending em vez de corte seco | `PlushBear.tsx` (anim logic) | Médio | ⏳ Pendente |
| 2.3 | **Resposta ao scroll/página** — urso "acorda" quando tela foca, "dorme" quando sai | `BearStage.tsx`, `stage.ts` | Baixo | ⏳ Pendente |
| 2.4 | **Micro-expressões contínuas** — respiração visível no corpo, orelhas tremendo, cauda (se adicionar) | `PlushBear.tsx` (useFrame) | Baixo | ✅ Concluído |

### **P3 — Interação Rica (Diferencial)**

| # | Melhoria | Arquivos | Esforço | Status |
|---|----------|----------|---------|--------|
| 3.1 | **Carinho direcional melhor** — fios seguem dedo com inércia, "marca" fica por 1-2s | `furMaterial.ts` (brush), `PlushBear.tsx` | Médio | ⏳ Pendente |
| 3.2 | **Tap zones diferenciadas** — barriga (risada), cabeça (ronronar), pata (aperto de mão), orelha (coça) | `PlushBear.tsx` (handleTap + geometry) | Médio | ⏳ Pendente |
| 3.3 | **Arrastar urso** — pegar e mover (com física de balanço) | `PlushBear.tsx`, `stage.ts` | Alto | ⏳ Pendente |
| 3.4 | **Presente surpresa** — ao clicar laço, solta corações/partículas | `PlushBear.tsx`, novo componente | Baixo | ⏳ Pendente |

### **P4 — Performance & Qualidade (Técnico)**

| # | Melhoria | Arquivos | Esforço | Status |
|---|----------|----------|---------|--------|
| 4.1 | **LOD automático** — shells 32→22→12 baseado em FPS/dispositivo | `BearStage.tsx`, `stage.ts` | Médio | ⏳ Pendente |
| 4.2 | **InstancedMesh para olhos/brilhos** — reduz draw calls | `PlushBear.tsx` | Baixo | ⏳ Pendente |
| 4.3 | **Shader otimizado** — remover branches, pré-computar noise em texture | `furMaterial.ts` | Alto | ⏳ Pendente |
| 4.4 | **Fallback gracioso** — modo "low poly" sem fur para devices muito fracos | `BearStage.tsx`, novo `SimpleBear.tsx` | Médio | ⏳ Pendente |

### **P5 — Variedade & Customização (Produto)**

| # | Melhoria | Arquivos | Esforço | Status |
|---|----------|----------|---------|--------|
| 5.1 | **Morph targets** — corpo mais gordo/magro, orelhas caídas/pontudas, focinho curto/longo | `bearGeometry.ts`, `PlushBear.tsx` | Alto | ⏳ Pendente |
| 5.2 | **Acessórios trocáveis** — chapéu, óculos, bandana, mochila (via props) | Novo `BearAccessories.tsx` | Médio | ⏳ Pendente |
| 5.3 | **Cores de pelagem baseadas na paleta do tema** — já faz, mas expandir para tons pastel | `PlushBear.tsx`, `theme/styles.ts` | Baixo | ⏳ Pendente |

---

## 📝 Log de Execução

### 2026-10-10 — Sprint "Quick Wins"
- ✅ **1.1** Pelagem mais fofa: density 60→85, furLen 0.085→0.11, noise scale 7→5.5, strandLen 0.55-1.0→0.45-0.95
- ✅ **1.3** Variação de cor: slot 0 (corpo) mais escuro, slot 1 (focinho/solas) mais claro, slot 2 (orelha interna) rosado; tint nas bochechas ampliado
- ✅ **1.4** Olhos: íris marrom sutil, pupilas dilatam no abraço, catchlights 2→3 com posicionamento anatômico
- ✅ **1.5** Nariz: MeshPhysicalMaterial com clearcoat 1.0, clearcoatRoughness 0.05, sheen para brilho úmido
- ✅ **2.1** 4 novos gestos: `peek` (esconde rosto), `sleep` (dorme), `curious` (inclina cabeça), `shy` (orelhas para baixo)
- ✅ **2.4** Micro-expressões: respiração no corpo (scale Y), orelhas tremendo sutil, head micro-movements

---

## 🎯 Próximos Passos (Prioridade)

1. **2.2** Transições suaves entre gestos (blending)
2. **3.1** Carinho direcional melhor com inércia
3. **3.2** Tap zones diferenciadas (barriga, cabeça, pata, orelha)
4. **4.1** LOD automático baseado em FPS
5. **1.2** Subsurface scattering leve no shader