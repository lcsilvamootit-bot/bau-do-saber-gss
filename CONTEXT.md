# Baú do Saber — Documentação de Contexto
> Criado em: 2026-03-04 | Arquivo: `index.html` | Projeto: Hackaton GSS

---

## 1. Visão Geral da Aplicação

**Baú do Saber** é um protótipo de interface de apoio à decisão executiva para o Grupo GSS (SBT/Jequiti/Cenografia). Simula um sistema de IA multi-agente que cruza dados de ERP, Ibope/Kantar, CENP e CRM para gerar pareceres executivos em tempo real.

O projeto é um **single-file HTML** (`index.html`) com:
- CSS inline no `<style>`
- JavaScript vanilla no `<script>`
- Ícones via **Lucide CDN** (`https://unpkg.com/lucide@latest`)
- Zero dependências de backend — tudo é simulação local com `setTimeout`

---

## 2. Layout — Estrutura de Blocos

```
<body>
├── <aside id="sb">         ← Sidebar (toggle com classe .off)
│   ├── .sh                 ← Sidebar header (logo + botão toggle)
│   ├── <nav class="sm">    ← Navegação lateral (painéis, alertas, histórico)
│   └── .sf                 ← Footer da sidebar (perfil do usuário)
│
└── <main class="ma">
    ├── .tb                 ← Topbar (título + botão "Abrir no Teams")
    ├── <div id="ca">       ← Content Area (alterna entre tela inicial e chat)
    │   ├── <div id="es">   ← Empty State (tela de boas-vindas com os 4 cards)
    │   └── <div id="mw">   ← Message Wrapper (container do chat, hidden por padrão)
    │       └── <div id="ml"> ← Message List (onde as mensagens são injetadas)
    │
    └── .ia                 ← Input Area (campo de texto + botão enviar)
```

---

## 3. Mapa de Classes CSS

> ⚠️ O CSS usa nomes abreviados. Este mapa é essencial sem IntelliSense.

### Layout
| Classe | Significado | Uso |
|--------|-------------|-----|
| `.sb` | sidebar | `<aside>` lateral esquerda |
| `.sb.off` | sidebar fechada | width:0, sem borda |
| `.sbi` | sidebar inner | conteúdo interno da sidebar |
| `.sh` | sidebar header | topo da sidebar |
| `.sm` | sidebar menu | nav de itens |
| `.sf` | sidebar footer | rodapé com perfil |
| `.ma` | main area | área principal direita |
| `.tb` | topbar | barra superior |
| `.tl` | topbar left | grupo esquerdo da topbar |
| `.ca` | content area | área de conteúdo com scroll |
| `.ia` | input area | área do campo de input |

### Sidebar Items
| Classe | Significado |
|--------|-------------|
| `.mt` | menu title (label de seção, ex: "Painéis Ativos") |
| `.mi` | menu item (item clicável da nav) |
| `.mi.on` | item ativo/selecionado |
| `.pi` | profile item (linha do perfil no footer) |
| `.pa` | profile avatar (círculo com iniciais) |
| `.ib` | icon button (botão transparente com ícone) |

### Status Dots (alertas na sidebar)
| Classe | Cor | Significa |
|--------|-----|-----------|
| `.dot.dr` | vermelho (`--rd`) | Urgente |
| `.dot.dy` | amarelo (`--ye`) | Atenção |
| `.dot.dg` | verde (`--gr`) | OK |

### Tela Inicial (Empty State)
| Classe | Significado |
|--------|-------------|
| `.em` | empty state container (centro da tela) |
| `.ml` | media logo (círculo com logo GSS) |
| `.cg` | cards grid (grade 2x2 dos 4 cases) |
| `.sc` | suggestion card (card clicável de case) |
| `.sl2` | small label 2 (label de categoria do card, ex: "⚽ Copa 2026") |
| `.st` | suggestion title (título do card) |
| `.sm2` | small meta 2 (subtítulo/alerta do card) |
| `.src-tag` | source tag (badge azul com fontes de dados) |

### Chat / Mensagens
| Classe | Significado |
|--------|-------------|
| `.mwrap` | message wrapper inner (max-width, padding) |
| `.mu` | message user (bolha azul do usuário, alinhada à direita) |
| `.mai` | message AI (container da resposta da IA) |
| `.ah` | agent header (avatar + nome do agente) |
| `.av` | agent avatar (círculo com logo) |
| `.an` | agent name (texto com nome do agente) |
| `.aib` | agent inner body (onde flow() injeta os steps e cards) |

### Steps de Agente (animação)
| Classe | Significado |
|--------|-------------|
| `.stps` | steps container |
| `.stp` | step item (uma linha "Agente X: fazendo Y...") |
| `.stp.dn` | step done (step concluído, texto verde) |
| `.si` | step icon (círculo esquerdo do step) |
| `.si.ok` | step icon concluído (verde com ✓) |
| `.si.sp` | step icon em progresso (animação de spinner CSS) |
| `.src-row` | source row (texto "🔗 Fonte: X" dentro do step) |

### Cards de Parecer (resultado)
| Classe | Significado |
|--------|-------------|
| `.ec` | evidence card (container do card de parecer) |
| `.ech` | evidence card header (cabeçalho azul escuro) |
| `.ecb` | evidence card body (corpo branco do card) |
| `.badge` | badge genérico |
| `.bred` / `.bgrn` / `.bylw` | badge vermelho / verde / amarelo |
| `.kg` | kpi grid (grade de 3 métricas-chave) |
| `.kb` | kpi box (caixa individual de KPI) |
| `.kl` | kpi label (rótulo do KPI) |
| `.kv` | kpi value (valor grande do KPI) |
| `.kv.g/.r/.b/.y` | valor em verde/vermelho/azul/amarelo |
| `.ks` | kpi sub (subtexto do KPI) |
| `.sdv` | section divider (título de seção: "Recomendação") |
| `.bt2` | body text 2 (texto corrido do parecer) |
| `.src-pill` | source pill (badge inline azul citando fonte) |
| `.acts` | actions (container dos botões de ação) |
| `.sim-area` | simulation area (onde o simulador é injetado) |
| `.sched-area` | scheduler area (onde o agendador Teams é injetado) |

### Botões
| Classe | Significado |
|--------|-------------|
| `.btn` | base do botão |
| `.bp` | button primary (azul GSS) |
| `.bpu` | button purple (roxo Teams) |
| `.bo` | button outline (branco com borda) |
| `.tbtn` | topbar button (estilo pill arredondado) |

### Agendamento Microsoft Teams
| Classe | Significado |
|--------|-------------|
| `.tm-steps` | container dos steps do agendamento Teams |
| `.tm-hd` | header dos steps Teams |
| `.mc` | meeting card (card de reunião agendada) |
| `.mc-hd` | meeting card header (roxo) |
| `.mc-sub` | meeting card subtitle |
| `.mc-bd` | meeting card body |
| `.mc-meta` | meeting metadata (data, duração, qtd participantes) |
| `.ptcs` | participants container |
| `.ptc` | participant chip (avatar + nome + cargo) |
| `.ptc-av` | participant avatar |
| `.ag-box` | agenda box (caixa azul claro com pauta da reunião) |

### Simulador de Receita (Copa)
| Classe | Significado |
|--------|-------------|
| `.sim-c` | simulator container |
| `.sr` | simulator result (box cinza com valor incremental) |
| `.sl3` | small label 3 (rótulo dentro do resultado) |
| `.sv` | simulator value (valor grande em verde) |

### Variáveis CSS
| Variável | Valor | Uso |
|----------|-------|-----|
| `--bl` | `#002855` | azul GSS (cor primária) |
| `--ye` | `#F2A900` | amarelo GSS |
| `--gr` | `#008751` | verde (positivo/OK) |
| `--rd` | `#D32F2F` | vermelho (urgente/negativo) |
| `--pu` | `#5B5FC7` | roxo (Microsoft Teams / IA) |
| `--bd` | `#ECECEC` | border default |
| `--hv` | `#F0F0F0` | hover background |
| `--t1` | `#0D0D0D` | text primary |
| `--t2` | `#5E5E5E` | text secondary |

---

## 4. Fluxo de Dados JavaScript

### Ponto de entrada — Clique num card
```
go(mode)                           ← chamado pelo onclick dos cards
  └─ chat(LABELS[mode], mode)      ← cria a mensagem do usuário e chama flow()
       ├─ esconde #es (empty state)
       ├─ mostra #mw (message wrapper)
       ├─ injeta bolha .mu (mensagem do usuário)
       ├─ injeta .mai (resposta da IA com .aib vazio)
       └─ flow(.aib, mode)         ← ASYNC: anima steps e depois inicia o card
```

### Ponto de entrada — Campo de texto livre
```
hs()                               ← handleSubmit, chamado pelo Enter ou botão
  └─ chat(input.value, 'custom')   ← usa o flow 'custom' (3 steps genéricos)
```

### Função `flow(b, mode)` — ASYNC
```
flow(b='div.aib', mode='pricing')
  ├─ cria div.stps, appenda em b
  ├─ for each step em FLOWS[mode]:
  │    ├─ cria .stp com .si.sp (spinner)
  │    ├─ aguarda 1300ms (dl(1300))
  │    └─ substitui para .stp.dn com .si.ok (✓)
  ├─ aguarda 500ms
  └─ chama a função de card correspondente:
       pricing    → pcrd(b)
       cenografia → cncrd(b)
       grade      → gradecrd(b)
       jequiti    → jeqcrd(b)
       custom     → xcrd(b)
```

### Funções de Card (pcrd, cncrd, gradecrd, jeqcrd, xcrd)
- Cada uma cria um `div.ec` via `createElement` + `appendChild(b)`
- **IMPORTANTE:** Nunca usar `b.innerHTML +=` — isso destrói os `.stps` animados anteriores
- Após injetar o HTML, chamam `lucide.createIcons()` para renderizar os ícones

### Botão "Simular Receita" → `openSim(btn)`
- Encontra `.sim-area` via `btn.closest('.ecb')`
- Usa `area.dataset.open` como flag (evita reentrada)
- IDs do simulador são únicos por timestamp (`sim_<Date.now()>`)
- O slider chama `updS(value, uid)` que atualiza os spans de resultado

### Botão "Agendar no Teams" → `openScheduler(btn, key)`
- Encontra `.sched-area` via `btn.closest('.ecb')`
- Usa `area.dataset.open` como flag (evita reentrada)
- Busca participantes de `MEMBERS[key]`
- A busca por membros extras usa `GRAPH_DIR` (mock do Microsoft Graph)
- Após confirmar, chama `runSchedule(btn, uid, key)` (ASYNC, 5 steps simulados)
- No final, chama `renderMeeting(container, key)` com o card de confirmação

---

## 5. Dados Estáticos

### `LABELS` — Texto da pergunta do usuário por mode
```js
LABELS = { pricing, cenografia, grade, jequiti }
```

### `FLOWS` — Steps de agente por mode
```js
FLOWS[mode] = [ { t: 'texto do step', s: 'fonte de dados' }, ... ]
// modes: pricing | cenografia | grade | jequiti | custom
```

### `MEMBERS` — Participantes sugeridos por reunião
```js
MEMBERS = {
  copa:  [...],  // VP Comercial, Dir. Mídia, Dir. Jurídico, Dir. Digital, Ger. Copa
  cen:   [...],  // Dir. Produção, Ger. Cenografia, Coord. Compras, Analista Budget
  grade: [...],  // Dir. Programação, Ger. Conteúdo, Analista Ibope, Dir. Mídia
  jeq:   [...]   // VP Jequiti, Dir. Marketing, Ger. CRM, Dir. Digital
}
```

### `AGENDAS` — Pauta pré-definida por reunião
```js
AGENDAS = { copa, cen, grade, jeq }
```

### `MEETINGS` — Sufixo da URL do Teams por reunião
```js
MEETINGS = { copa:'copa2026', cen:'cenografia', grade:'grade-sbt', jeq:'jequiti' }
// Link gerado: gss-teams-prototype.html?meeting=<valor>
```

### `GRAPH_DIR` — Mock do Microsoft Graph (busca de pessoas)
```js
GRAPH_DIR = [ { i: 'iniciais', n: 'nome', r: 'cargo', c: '#cor-hex' }, ... ]
// 6 pessoas disponíveis para adicionar via busca
```

---

## 6. Arquivos do Projeto

| Arquivo | Descrição |
|---------|-----------|
| `index.html` | Aplicação completa (este arquivo) |
| `gss.png` | Logo GSS — usado no avatar do Baú do Saber e na sidebar |
| `gss-teams-prototype.html` | Protótipo da tela Microsoft Teams (link externo) |

---

## 7. Pontos de Atenção (Armadilhas)

1. **`innerHTML +=` PROIBIDO nos cards** — destrói elementos filhos existentes (como `.stps`). Sempre usar `createElement` + `appendChild`.
2. **Guards com `dataset.open`** — `openSim` e `openScheduler` usam `area.dataset.open` para evitar dupla abertura. Não usar `area.innerHTML` como guard (falha com whitespace).
3. **IDs do simulador são dinâmicos** — `sim_<timestamp>` para evitar conflito. A função `updS(v, uid)` recebe o uid como parâmetro.
4. **`lucide.createIcons()` deve ser chamado após injetar HTML** — ícones `<i data-lucide="...">` só são renderizados quando a função é invocada depois da injeção no DOM.
5. **`dl(ms)`** é um utilitário de delay: `var dl = ms => new Promise(r => setTimeout(r, ms))`.
6. **Sidebar inicia fechada** — `<aside class="sb off" id="sb">`. A classe `.off` remove width e border.
