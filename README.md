# Um abraço, Bernardo

Site vitrine e loja (mobile-first) de ursos de pelúcia, balões montados e flores.
React 19 + TypeScript + Vite, animações com Framer Motion, modelos 3D interativos com
React Three Fiber, autenticação Firebase, frete por CEP via ViaCEP e checkout com
pagamento simulado (Pix e cartão).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + build de produção em dist/
```

## Configuração

Copie `.env.example` para `.env` e preencha:

| Variável | Para quê |
| --- | --- |
| `VITE_FIREBASE_*` | Login (Google e e-mail/senha) e gravação de pedidos no Firestore |
| `VITE_WHATSAPP_NUMBER` | Número da loja nos links do WhatsApp (só dígitos com DDI, ex.: `5511999999999`) |

Sem as chaves do Firebase o site roda em **modo demonstração**: o login e os pedidos
são simulados e ficam salvos só no navegador.

### Firebase

1. Crie um projeto e um app Web no console do Firebase e copie a configuração para o `.env`.
2. Em **Authentication → Método de login**, ative **Google** e **E-mail/senha**.
   Adicione o domínio do site em *Domínios autorizados*.
3. Crie o **Firestore** e publique regras como estas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /orders/{id} {
      allow create: if request.auth != null && request.resource.data.customer.uid == request.auth.uid;
      allow read:   if request.auth != null && resource.data.customer.uid == request.auth.uid;
    }
  }
}
```

O login só é exigido no checkout (etapa "Você"). Ninguém precisa criar conta para navegar.

## Paleta e fontes

Há 5 paletas e 5 pares de fontes em `src/theme/styles.ts`. No `npm run dev` (ou abrindo o
site com `?estilo` no endereço) aparece a aba **Estilo** na borda esquerda para comparar as
opções ao vivo. A escolha fica salva no navegador. Depois de decidir, ajuste
`DEFAULT_PALETTE` e `DEFAULT_FONTS` e, se quiser, remova o `<StylePicker />` do `App.tsx`.

## Pagamento (simulado)

`src/lib/payments.ts` é um gateway **de mentira** com a mesma forma de um real:
`createPixCharge`, `confirmPix` e `payWithCard`. O QR Code do Pix é decorativo.
Para testar o cartão, use `4111 1111 1111 1111`. Cartões terminados em `0002` são recusados.

Para ir para produção, troque a implementação por chamadas a um backend (ex.: Cloud
Function com Mercado Pago, Pagar.me ou Stripe) que crie a cobrança e grave o pedido
**depois** da confirmação via webhook. O cartão deve ser tokenizado pelo SDK do
provedor no navegador; dados de cartão nunca devem passar pelo seu servidor.

## Frete

`src/lib/cep.ts` consulta o [ViaCEP](https://viacep.com.br) e `src/lib/shipping.ts` aplica
a tabela de frete por região (Grajaú, Zona Sul, capital e Grande SP), com frete grátis
no Grajaú acima de R$ 199. Os valores são exemplos: ajuste a tabela quando a loja definir
os preços reais.

## 3D

- **Urso** (`src/three/PlushBear.tsx`): modelado proceduralmente a partir da pelúcia de
  referência (`design-reference/urso-referencia.png`). A pelagem usa *shell texturing*
  (`src/three/furMaterial.ts`): os fios balançam com a inércia do giro, quicam no
  "abraço" e deitam onde o dedo ou o mouse passa. Arraste para girar e toque para abraçar.
  A cor da pelúcia e a do laço mudam ao vivo.
- **Bubble** (`src/three/BubbleBalloon.tsx`): balão cristal com nome e idade aplicados na
  curvatura e mini balões de látex que chacoalham ao toque.
- O 3D é carregado sob demanda (chunk separado), pausa quando sai da tela e reduz a
  resolução sozinho em aparelhos lentos. Sem WebGL, aparece a ilustração SVG.

Os cards usam ilustrações em SVG (`src/components/ProductArt.tsx`) no estilo da logo.
Troque por fotos reais quando houver.

## Estrutura

```
src/
  data/products.ts     catálogo, opções, adicionais e cálculo de preço
  lib/                 ViaCEP, frete, pagamentos, Firebase, pedidos, WhatsApp
  store/               sacola, rascunho do checkout e UI (Zustand)
  auth/                AuthProvider (Firebase ou demonstração)
  three/               cenas 3D (urso, bubble, palco compartilhado)
  components/          header, navegação, cards, sheets, opções, CEP, login
  pages/               Home, Presentes, Produto, Monte o seu, Sacola, Checkout,
                       Pedido, Conta, Orçamento, Sobre
design-reference/      protótipos do Claude Design usados como ponto de partida
```

Os depoimentos da Home estão marcados como "Conteúdo de demonstração" e devem ser
trocados por avaliações reais.
