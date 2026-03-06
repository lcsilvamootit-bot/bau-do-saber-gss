
    /*
     * BAÚ DO SABER — Script Principal
     * ================================
     * Documentação de contexto: CONTEXT.md (mesmo diretório)
     *
     * ARQUITETURA GERAL:
     *   go(mode) -> chat(txt, mode) -> flow(elem, mode) -> [pcrd|cncrd|gradecrd|jeqcrd|xcrd](elem)
     *
     * MODOS DISPONÍVEIS: 'pricing' | 'cenografia' | 'grade' | 'jequiti' | 'custom'
     *
     * REGRA CRÍTICA DE DOM:
     *   Nunca usar b.innerHTML += nas funções de card — isso destrói os .stps animados.
     *   Sempre usar createElement('div') + appendChild(b).
     *
     * DEPENDÊNCIA EXTERNA:
     *   Lucide Icons via CDN (https://unpkg.com/lucide@latest)
     *   Chamar lucide.createIcons() após qualquer injeção de [i data-lucide=...] no DOM.
     */

    /* Global State */
    var currentMode = 'custom';

    /* Renderiza todos os ícones Lucide presentes no DOM no momento do carregamento */
    lucide.createIcons();

    /* =================== MODAL HELPERS =================== */
    function createModal(title, badgeHtml) {
      closeModal(); /* Garante apenas 1 modal ativo */
      var ov = document.createElement('div');
      ov.className = 'modal-overlay';
      ov.id = 'bds-modal';
      ov.onclick = function (e) { if (e.target === ov) closeModal() };

      var box = document.createElement('div');
      box.className = 'modal-box';

      var bdg = badgeHtml ? badgeHtml : '';
      box.innerHTML = '<div class="modal-hd"><div class="modal-title">' + title + ' ' + bdg + '</div><button class="modal-close" onclick="closeModal()">&times;</button></div><div class="modal-bd"></div>';
      ov.appendChild(box);
      document.body.appendChild(ov);
      return box.querySelector('.modal-bd');
    }

    function closeModal() {
      var m = document.getElementById('bds-modal');
      if (m) {
        /* Remove o dataset.open do botão que originou o modal (se houver) */
        if (m.dataset.sourceBtnId) {
          var btn = document.getElementById(m.dataset.sourceBtnId);
          if (btn) delete btn.dataset.open;
        }
        m.remove();
      }
    }

    /* =================== COMPARTILHAMENTO =================== */
    function toggleShareMenu(e) {
      e.stopPropagation();
      document.getElementById('shareMenu').classList.toggle('open');
    }

    function shareTo(target) {
      var menu = document.getElementById('shareMenu');
      menu.classList.remove('open');

      var content = getChatSummary();
      var title = "Baú do Saber - Insight Executivo";
      var text = content.intro + "\n\n" + content.body + "\n\n---\nAcesse a plataforma GSS para o dashboard completo.";
      var url = window.location.href;

      if (target === 'whatsapp') {
        var wpUrl = "https://wa.me/?text=" + encodeURIComponent(text + "\n" + url);
        window.open(wpUrl, '_blank');
      } else if (target === 'email') {
        var mailUrl = "mailto:?subject=" + encodeURIComponent(title) + "&body=" + encodeURIComponent(text + "\n" + url);
        window.location.href = mailUrl;
      } else if (target === 'copy') {
        navigator.clipboard.writeText(text + "\n" + url).then(function () {
          alert('Resumo copiado para a área de transferência!');
        });
      } else if (target === 'pdf') {
        var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
        var dt = new Date().toLocaleString('pt-BR');
        var w = window.open('', '_blank');
        if (w) {
          var html = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;padding:32px;color:#111}h1{font-size:20px;margin:0 0 8px;color:#002855}h2{font-size:14px;margin:0 0 18px;color:#5E5E5E}p{font-size:13.5px;line-height:1.6;white-space:pre-wrap}hr{border:none;border-top:1px solid #e0e0e0;margin:20px 0}footer{font-size:11px;color:#666}</style></head><body><h1>Baú do Saber — Resumo</h1><h2>' + esc(content.intro) + '</h2><p>' + esc(content.body) + '</p><hr><footer>Gerado em ' + esc(dt) + ' — ' + esc(url) + '</footer></body></html>';
          w.document.open();
          w.document.write(html);
          w.document.close();
          w.focus();
          setTimeout(function () { try { w.print(); } catch (e) { } }, 300);
        } else {
          alert('Permita pop-ups para gerar o PDF.');
        }
      }
    }

    function getChatSummary() {
      var ml = document.getElementById('ml');
      var userMsg = ml.querySelector('.mu');
      var lastAiMsg = ml.querySelector('.mai:last-child');

      var summary = {
        intro: "Insight compartilhado via Baú do Saber GSS",
        body: ""
      };

      if (userMsg) {
        summary.intro = "Insight sobre: " + userMsg.innerText;
      }

      if (lastAiMsg) {
        // Tenta pegar o texto do diagnóstico ou parecer
        var p = lastAiMsg.querySelector('p.bt2');
        if (p) {
          summary.body = p.innerText.substring(0, 300) + "...";
        } else {
          summary.body = "Clique no link para ver o detalhamento completo no Agente Ativo.";
        }
      }

      return summary;
    }

    window.addEventListener('click', function () {
      var menu = document.getElementById('shareMenu');
      if (menu) menu.classList.remove('open');
    });

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

    /* dl(ms) — utilitário de delay assíncrono usado nas animações de flow() e runSchedule() */
    var dl = function (ms) { return new Promise(function (r) { setTimeout(r, ms) }) };

    /* tg() — toggle da sidebar: adiciona/remove classe .off no <aside id="sb"> */
    function tg() { document.getElementById('sb').classList.toggle('off') }

    /* hs() — handleSubmit: lê o input #ci e dispara chat() no modo 'custom' (perguntas livres) */
    function hs() { var v = document.getElementById('ci').value.trim(); if (!v) return; document.getElementById('ci').value = ''; chat(v, 'custom') }

    /*
     * LABELS — Texto da pergunta do usuário exibida como bolha .mu quando clicado num card.
     * go(mode) busca aqui antes de chamar chat().
     * Chaves mapeiam exatamente para as chaves de FLOWS e MEMBERS.
     */
    var LABELS = {
      pricing: 'Analisar precificação do inventário publicitário para Copa 2026',
      cenografia: 'Analisar impacto da crise EUA x Irã nos custos de Cenografia',
      gov: 'Considerando orçamento, políticas internas e criticidade operacional, devemos aprovar a compra do painel de LED com licença de software?',
      jequiti: 'Considerando que há viabilidade de calendário para 14/03, como estruturar uma Jequiti Live Show no padrão Jequiti + SBT, quais áreas e aprovações precisam ser acionadas, quais informações internas devem ser disseminadas entre os times e como sinais de mercado e sentimento do público podem orientar mix, oferta e escolha de influenciadores?'
    };

    /* go(mode) — ponto de entrada dos cards da tela inicial. Traduz mode em texto e chama chat() */
    function go(m) { chat(LABELS[m] || 'Análise executiva', m) }

    /* resetView() — Volta para a tela inicial (Empty State) */
    function resetView() {
      document.getElementById('es').style.display = 'flex';
      document.getElementById('mw').style.display = 'none';
      document.getElementById('ml').innerHTML = '';
      currentMode = 'custom';
    }

    /*
     * chat(txt, mode) — Função central de interação.
     *   1. Esconde #es (empty state / tela de boas-vindas)
     *   2. Mostra #mw (message wrapper) com display:flex
     *   3. Limpa #ml (message list) — apenas uma conversa ativa por vez
     *   4. Injeta bolha .mu (mensagem do usuário) com o txt recebido
     *   5. Injeta container .mai (resposta da IA) com .aib vazio
     *   6. Chama flow(.aib, mode) — ASYNC — que anima os steps e depois injeta o card
     */
    function chat(txt, mode) {
      currentMode = mode || 'custom';
      document.getElementById('es').style.display = 'none';
      var w = document.getElementById('mw'); w.style.display = 'flex';
      var ml = document.getElementById('ml'); ml.innerHTML = '';
      var u = document.createElement('div'); u.className = 'mu'; u.innerHTML = txt; ml.appendChild(u);
      var ai = document.createElement('div'); ai.className = 'mai';
      ai.innerHTML = '<div class="ah"><div class="av"><img src="gss.png"></div><div class="an">Ba&uacute; do Saber &mdash; Agentes Ativos</div></div><div class="aib"></div>';
      ml.appendChild(ai); sb2();
      flow(ai.querySelector('.aib'), currentMode); /* .aib é o alvo onde flow() injeta steps e card */
    }

    /* sb2(container) — scrollBottom: força scroll suave para o final do container (ou modal ativo) */
    function sb2(container) {
      if (!container) {
        var m = document.querySelector('.modal-bd');
        container = m ? m : document.getElementById('mw');
      }
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        var target = container.lastElementChild;
        if (target && target.lastElementChild) target = target.lastElementChild;
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
    /* =================== AGENT FLOWS BY CASE ===================
     * FLOWS[mode] = array de steps { t: 'texto do agente', s: 'nome da fonte de dados' }
     * Cada step é animado por flow() com 1300ms de intervalo.
     * Após todos os steps, flow() chama a função de card correspondente ao mode.
     */
    var FLOWS = {
      pricing: [
        { t: 'Agente ERP Invent&aacute;rio: segmentando 143 breaks por fase e rating projetado...', s: 'ERP Invent.' },
        { t: 'Agente ERP Talentos: consultando disponibilidade de elenco liderado por Falcão Bueno...', s: 'ERP Talentos' },
        { t: 'Agente Web: mapeando repercuss&atilde;o externa e confirma&ccedil;&otilde;es na imprensa...', s: 'Google News / Web' },
        { t: 'Agente CENP: cruzando CPM praticado vs. benchmark por n&iacute;vel de audi&ecirc;ncia...', s: 'CENP / Ibope' },
        { t: 'Agente S&iacute;ntese: consolidando oportunidade de R$ 68M e an&aacute;lise de mercado...', s: 'Modelo GSS' }
      ],
      cenografia: [
        { t: 'Agente Geopol&iacute;tico: monitorando escalada EUA x Ir&atilde; e impacto no Brent...', s: 'Reuters / Bloomberg' },
        { t: 'Agente Petrobras: verificando repasse de pre&ccedil;os em refinarias e frete...', s: 'Petrobras / ANP' },
        { t: 'Agente C&acirc;mbio: analisando volatilidade USD/BRL (+2,8% em 7 dias)...', s: 'BCB / Invest.com' },
        { t: 'Agente PCP SBT: recalculando BOM do cenário temporada 2026 via choque...', s: 'PCP Interno' },
        { t: 'Agente S&iacute;ntese: consolidando aumento de +9,0% e justificativa SVE...', s: 'Modelo GSS' }
      ],
      gov: [
        { t: 'Agente ERP Financ.: lendo saldo or&ccedil;ament&aacute;rio, centro de custo e al&ccedil;ada...', s: 'ERP Financeiro e Al&ccedil;adas' },
        { t: 'Agente Estat&iacute;stico: comparando com hist&oacute;rico e varia&ccedil;&atilde;o padr&atilde;o interna...', s: 'Hist&oacute;rico Estat&iacute;stico Interno' },
        { t: 'Agente Operacional: validando criticidade e depend&ecirc;ncia de licen&ccedil;a...', s: 'Opera&ccedil;&atilde;o e Invent&aacute;rio' },
        { t: 'Agente Pol&iacute;ticas: conferindo ader&ecirc;ncia a exce&ccedil;&otilde;es e compliance...', s: 'Pol&iacute;ticas Internas' },
        { t: 'Agente Impacto: projetando custo, continuidade e exposi&ccedil;&atilde;o contratual...', s: 'Modelo GSS de Impacto' },
        { t: 'Agente Supervisor: consolidando recomenda&ccedil;&atilde;o com justificativa rastre&aacute;vel...', s: 'Camada Executiva' }
      ],
      jequiti: [
        { t: 'Consultando o padrão interno Jequiti + SBT para live commerce: antecedência, áreas obrigatórias, fluxo de produção, cenário e figurino...', s: 'Playbook Interno Jequiti + SBT' },
        { t: 'Mapeando dependências operacionais: estúdio, agenda de apresentadores, equipe técnica, infra, segurança e aprovações cruzadas...', s: 'Operação, Agenda e Infraestrutura' },
        { t: 'Analisando mix de produtos, profundidade de desconto, estoque, margem e meta de caixa para a edição de 14/03...', s: 'Comercial, E-commerce e Pricing' },
        { t: 'Cruzando sinais de mercado para identificar categorias e narrativas com maior potencial de tração comercial no período...', s: 'Mercado de Beleza e Live Commerce' },
        { t: 'Classificando influenciadores por aderência à categoria, linguagem, público e potencial de conversão para consolidar recomendação...', s: 'Análise de Sentimento e Aderência' }
      ],
      custom: [
        { t: 'Carregando contexto executivo do Grupo GSS...', s: 'Sistema' },
        { t: 'Analisando dados internos e refer&ecirc;ncias de mercado...', s: 'Multi-fonte' },
        { t: 'Processando com agentes especializados Ba&uacute; do Saber...', s: 'Modelo GSS' }
      ]
    };

    /*
     * flow(b, mode) - ASYNC. Núcleo da animação de agentes.
     *   b    = elemento .aib (agent inner body) onde os steps e o card serão injetados
     *   mode = chave de FLOWS. Se não existir, usa FLOWS.custom
     *
     * Sequência:
     *   1. Cria div.stps e appenda em b
     *   2. Para cada step: cria .stp com .si.sp (spinner), aguarda 1300ms, substitui por .stp.dn + .si.ok (check)
     *   3. Aguarda 500ms após o último step
     *   4. Despacha para a função de card: pcrd | cncrd | gradecrd | jeqcrd | xcrd
     *
     * ARMADILHA: as funções de card DEVEM usar appendChild(b) - nunca innerHTML +=
     *   pois isso destrói os .stps já existentes no DOM.
     */
    async function flow(b, mode) {
      var steps = FLOWS[mode] || FLOWS.custom;
      var sd = document.createElement('div'); sd.className = 'stps'; b.appendChild(sd);
      for (var s of steps) {
        var el = document.createElement('div'); el.className = 'stp';
        el.innerHTML = '<div class="si sp"></div><div><span>' + s.t + '</span><div class="src-row">&#128279; Fonte: ' + s.s + '</div></div>';
        sd.appendChild(el); sb2(); await dl(1300);
        el.className = 'stp dn';
        el.innerHTML = '<div class="si ok">&#10003;</div><div><span>' + s.t + '</span><div class="src-row">&#128279; Fonte: ' + s.s + '</div></div>';
        sb2();
      }
      await dl(500);
      if (mode === 'pricing') pcrd(b);
      else if (mode === 'cenografia') cncrd(b);
      else if (mode === 'gov') govcrd(b);
      else if (mode === 'jequiti') jeqcrd(b);
      else xcrd(b);
      sb2();
    }

    /* =================== CASE 1: COPA =================== */
    function pcrd(b) {
      var el = document.createElement('div');
      el.className = 'ec';
      el.innerHTML = `<div class="ech">
        <h3><i data-lucide="trending-up" size="15"></i>Parecer &mdash; Invent&aacute;rio Copa 2026</h3>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="badge bred">A&ccedil;&atilde;o Urgente</span>
        </div>
      </div><div class="ecb">
<p class="bt2"><strong>Diagn&oacute;stico:</strong> Oportunidade captur&aacute;vel de <strong>R$ 68M</strong> via revis&atilde;o de tabela em 143 breaks <span class="src-pill internal">ERP Invent.</span>. A audi&ecirc;ncia projetada de 38 pts <span class="src-pill external">Ibope</span> &eacute; potencializada pelo elenco liderado por <strong>Falcão Bueno</strong>, garantindo reten&ccedil;&atilde;o premium.</p>
<div class="kg">
<div class="kb"><div class="kl">Receita Potencial</div><div class="kv g">R$ 378M</div><div class="ks">&#8593; +R$ 68M captur&aacute;vel</div></div>
<div class="kb"><div class="kl">Engajamento Talentos</div><div class="kv b">3.2x</div><div class="ks">vs. m&eacute;dia do mercado</div></div>
<div class="kb"><div class="kl">Invent&aacute;rio Ocupado</div><div class="kv y">82%</div><div class="ks">Pr&eacute;-venda iniciada</div></div>
</div>
<div class="sdv">Recomenda&ccedil;&atilde;o</div>
<p class="bt2">&#10003; <strong>Revisar CPM Premium</strong> (Breaks 1 e 2, &gt;35 pts) com acr&eacute;scimo de 18&ndash;22% sobre tabela base <span class="src-pill external">CENP Benchmark</span>.<br>&#10003; <strong>Pacote Copa + Digital:</strong> TV Aberta + pr&eacute;-roll +SBT com desconto de 10% &mdash; aumenta ocupa&ccedil;&atilde;o e ROI.<br>&#10003; <strong>Prioridade setorial:</strong> Alimentos &amp; Bebidas t&ecirc;m maior prop&ecirc;nso hist&oacute;rico a pagar premium <span class="src-pill internal">IM Comercial</span>.</p>
<div class="acts">
<button class="btn bp" id="btn-sim-copa" onclick="openSim(this)"><i data-lucide="sliders" size="14"></i>Simular Receita</button>
<button class="btn bpu" id="btn-sch-copa" onclick="openScheduler(this,'copa')"><i data-lucide="calendar" size="14"></i> Agendar no Teams</button>
<button class="btn bpu" id="btn-det-copa" onclick="openDetail(this)"><i data-lucide="zoom-in" size="14"></i> Detalhar</button>
<button class="btn bgr silvio-shine" onclick="openSilvio('pricing')"><i data-lucide="mic" size="14"></i> Modo Silvio</button>
</div>
</div>`;
      b.appendChild(el);
      lucide.createIcons();
    }

    /* =================== CASE 2: CENOGRAPHY =================== */
    function cncrd(b) {
      var el = document.createElement('div');
      el.className = 'ec';
      el.innerHTML = `<div class="ech">
        <h3><i data-lucide="layers" size="15"></i>Parecer &mdash; Cenografia: Crise Global</h3>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="badge bred">A&ccedil;&atilde;o Urgente</span>
        </div>
      </div><div class="ecb">
<p class="bt2"><strong>Diagn&oacute;stico:</strong> Repercuss&atilde;o imediata da escalada <strong>EUA x Ir&atilde;</strong> (05/mar) impacta o Brent (+5%) e o frete mar&iacute;timo <span class="src-pill external">Reuters</span>. O or&ccedil;amento de insumos do projeto <strong>Temporada 2026</strong> foi recalculado com aumento consolidado de <strong>+9,0%</strong> em itens petroqu&iacute;micos e dolarizados.</p>
<div class="kg">
<div class="kb"><div class="kl">Or&ccedil;amento Base</div><div class="kv b">R$ 434k</div><div class="ks">Pré-conflito</div></div>
<div class="kb"><div class="kl">Or&ccedil;amento Ajustado</div><div class="kv r">R$ 473k</div><div class="ks">Choque de Insumos</div></div>
<div class="kb"><div class="kl">Delta Necess&aacute;rio</div><div class="kv y">+R$ 39k</div><div class="ks">Verba Extra (SVE)</div></div>
</div>
<div class="sdv">Recomenda&ccedil;&atilde;o</div>
<p class="bt2">&#10003; <strong>Aprovar SVE de R$ 39k</strong> para garantir prazos de entrega frente ao risco de desabastecimento <span class="src-pill internal">PCP Compras</span>.<br>&#10003; <strong>Prioridade de Compra:</strong> Ilumina&ccedil;&atilde;o LED (+14%) e PVC (+12%) apresentam maior volatilidade e devem ser estocados <span class="src-pill external">Bloomberg</span>.<br>&#10003; <strong>Janela de Oportunidade:</strong> Antecipar RC (Requisi&ccedil;&atilde;o) antes de novo repasse de frete internacional.</p>
<div class="acts">
<button class="btn bp" id="btn-sim-cen" onclick="openSimCen(this)"><i data-lucide="sliders" size="14"></i>Simular Risco</button>
<button class="btn bpu" id="btn-sch-cen" onclick="openScheduler(this,'cen')"><i data-lucide="calendar" size="14"></i> Agendar com Comit&ecirc;</button>
<button class="btn bpu" id="btn-det-cen" onclick="openDetailCen(this)"><i data-lucide="zoom-in" size="14"></i> Detalhar BOM</button>
<button class="btn bgr silvio-shine" onclick="openSilvio('cenografia')"><i data-lucide="mic" size="14"></i> Modo Silvio</button>
</div>
</div>`;
      b.appendChild(el);
      lucide.createIcons();
    }

    /* =================== CASE 3: GOVERNANÇA =================== */
    function govcrd(b) {
      var el = document.createElement('div');
      el.className = 'ec';
      el.innerHTML = `<div class="ech">
        <h3><i data-lucide="shield-check" size="15"></i>Parecer Executivo &mdash; Aprova&ccedil;&atilde;o de Verba</h3>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="badge" style="background:#FFF3CD;color:#856404;border:1px solid #FFEEDB">Prioridade Alta</span>
        </div>
      </div><div class="ecb">
<p class="bt2"><strong>Diagn&oacute;stico:</strong> A an&aacute;lise dos dados internos propriet&aacute;rios indica que a solicita&ccedil;&atilde;o atende necessidade operacional relevante, por&eacute;m exige controle adicional por envolver valor acima da m&eacute;dia hist&oacute;rica, depend&ecirc;ncia recorrente de licen&ccedil;a e necessidade de ader&ecirc;ncia formal &agrave;s pol&iacute;ticas internas de contrata&ccedil;&atilde;o.</p>
<div class="kg">
<div class="kb"><div class="kl">Ader&ecirc;ncia &agrave; Pol&iacute;tica</div><div class="kv b">82%</div><div class="ks">Exige justificativa complementar</div></div>
<div class="kb"><div class="kl">Desvio vs Hist&oacute;rico</div><div class="kv y">+18%</div><div class="ks">Acima da m&eacute;dia de compras equivalentes</div></div>
<div class="kb"><div class="kl">Impacto Operacional</div><div class="kv r">Alto</div><div class="ks">Risco de indisponibilidade</div></div>
</div>
<div class="sdv">Recomenda&ccedil;&atilde;o</div>
<p class="bt2">&#10003; <strong>Aprovar compra</strong> com condicionante de conformidade &agrave;s pol&iacute;ticas internas e valida&ccedil;&atilde;o da exce&ccedil;&atilde;o de valor.<br>&#10003; <strong>Negociar cl&aacute;usulas</strong> de continuidade operacional, SLA, garantia estendida e previsibilidade de renova&ccedil;&atilde;o da licen&ccedil;a.<br>&#10003; <strong>Formalizar an&aacute;lise</strong> de impacto e reserva or&ccedil;ament&aacute;ria para custos recorrentes e depend&ecirc;ncia tecnol&oacute;gica futura.</p>
<div class="acts">
<button class="btn bp" id="btn-sim-gov" onclick="openSimGov(this)"><i data-lucide="sliders" size="14"></i>Simular Impacto</button>
<button class="btn bpu" id="btn-sch-gov" onclick="openScheduler(this,'gov')"><i data-lucide="calendar" size="14"></i> Agendar Comit&ecirc;</button>
<button class="btn bpu" id="btn-det-gov" onclick="openDetailGov(this)"><i data-lucide="zoom-in" size="14"></i> Detalhar An&aacute;lise</button>
<button class="btn bgr silvio-shine" onclick="openSilvio('gov')"><i data-lucide="mic" size="14"></i> Visão Executiva</button>
</div>
<div class="sched-area"></div>
</div>`;
      b.appendChild(el);
      lucide.createIcons();
    }

    /* =================== SIMULADOR GOVERNANÇA =================== */
    function openSimGov(btn) {
      if (btn.dataset.open) return;
      btn.dataset.open = '1';
      var uid = 'simgov_' + Date.now();
      var mbd = createModal('Simulador de Impacto da Decisão', '<span class="badge" style="background:#E3F0FF;color:#002855">An&aacute;lise Preditiva</span>');
      document.getElementById('bds-modal').dataset.sourceBtnId = btn.id;

      mbd.innerHTML = '<div class="sim-c"><h4><i data-lucide="calculator" size="14"></i> Índice Composto de Impacto e Retorno</h4><label style="font-size:12.5px;font-weight:700;display:flex;justify-content:space-between;margin-bottom:6px">N&iacute;vel de utiliza&ccedil;&atilde;o operacional prevista <span id="' + uid + '_sv">75</span>%</label><input type="range" min="0" max="100" value="75" style="width:100%;accent-color:var(--pu);margin-bottom:12px" oninput="updSGov(this.value,\'' + uid + '\')"><div class="sr"><div class="sl3">&Iacute;ndice Composto de Impacto e Retorno</div><div class="sv" id="' + uid + '_sv2" style="transition:color 0.3s ease;color:#008060">Boa Aderência</div><div style="font-size:11px;color:var(--t2);margin-top:3px">Fórmula: (utilização * peso) - (custo_total + risco_contratual)</div></div><div id="' + uid + '_summary" style="margin-top:14px;font-size:11.5px;color:var(--t2);padding:10px;background:#F8F9FA;border-radius:8px;border:1px solid var(--bd);line-height:1.4"><strong style="color:#008060">Investimento aderente:</strong> Consistente com a necessidade do neg&oacute;cio.</div></div>';
      lucide.createIcons();
    }

    window.updSGov = function (v, uid) {
      var sv = document.getElementById(uid + '_sv');
      var sv2 = document.getElementById(uid + '_sv2');
      var sum = document.getElementById(uid + '_summary');

      sv.textContent = v;

      if (v <= 30) {
        sv2.textContent = 'Destrói Valor';
        sv2.style.color = '#D62828';
        sum.innerHTML = '<strong style="color:#D62828">Baixa ader&ecirc;ncia operacional:</strong> Aprovação tende a destruir valor.';
      } else if (v <= 65) {
        sv2.textContent = 'Impacto Moderado';
        sv2.style.color = '#D97706';
        sum.innerHTML = '<strong style="color:#D97706">Impacto moderado:</strong> Aprovação depende de mitigadores contratuais e de política.';
      } else {
        sv2.textContent = 'Boa Aderência';
        sv2.style.color = '#008060';
        sum.innerHTML = '<strong style="color:#008060">Investimento aderente:</strong> Mais consistente com a necessidade do negócio.';
      }
    }

    /* =================== DETALHAR GOVERNANÇA =================== */
    window.openDetailGov = async function (btn) {
      if (btn.dataset.open) return;
      btn.dataset.open = '1';
      var origHtml = btn.innerHTML;
      btn.innerHTML = '<div class="si sp" style="border-width:2px;width:16px;height:16px;flex-shrink:0"></div> Analisando...';

      var mbd = createModal('Análise Cruzada com Dados Internos Restritos', '<span class="badge" style="background:#E8F5E9;color:#137333">Auditoria Executiva</span>');
      document.getElementById('bds-modal').dataset.sourceBtnId = btn.id;

      var govSteps = [
        { t: 'Lendo saldo orçamentário...', s: 'ERP Financeiro' },
        { t: 'Comparando com histórico e variação padrão...', s: 'Estatística Interna' },
        { t: 'Validando criticidade e regras de compliance...', s: 'Políticas Internas' }
      ];
      var sd = document.createElement('div'); sd.className = 'detail-mini-steps'; mbd.appendChild(sd);
      for (var s of govSteps) {
        var el = document.createElement('div'); el.className = 'stp';
        el.innerHTML = '<div class="si sp"></div><div><span>' + s.t + '</span><div class="src-row">&#128279; Fonte: ' + s.s + '</div></div>';
        sd.appendChild(el); await dl(700);
        el.className = 'stp dn';
        el.innerHTML = '<div class="si ok">&#10003;</div><div><span>' + s.t + '</span><div class="src-row">&#128279; Fonte: ' + s.s + '</div></div>';
      }
      await dl(400);

      var GOV_DATA = [
        { c1: 'Orçamento e Alçada', c2: 'Saldo com comprometimento parcial', c3: 'Vi&aacute;vel c/ condicionante', ref: 'Aprovação por faixa', d: '+7.8%', r: 'medio', x: 'A compra cabe no orçamento, mas ultrapassa faixas médias e exige justificativa adicional.' },
        { c1: 'Aderência à Política', c2: 'Necessidade de validação', c3: 'Parcialmente aderente', ref: 'Política corporativa', d: '-18%', r: 'medio', x: 'Há aderência majoritária, mas o caso requer formalização complementar para aprovação segura.' },
        { c1: 'Impacto Operacional', c2: 'Alta criticidade de uso e dependência', c3: 'Relevante para continuidade', ref: 'Indicadores internos', d: '+32%', r: 'alto', x: 'A não aprovação amplia risco de indisponibilidade e pressiona soluções paliativas mais caras.' }
      ];

      var rows = GOV_DATA.map(function (d) {
        return '<div class="phase-row" style="padding:10px 14px;border-bottom:1px solid var(--bd);flex-wrap:wrap;align-items:flex-start">'
          + '<div style="display:flex;width:100%;gap:10px">'
          + '<div style="width:140px;font-weight:700;font-size:12.5px;color:var(--bl)">' + d.c1 + '</div>'
          + '<div style="flex:1;font-size:11px;color:var(--t1)"><span style="color:var(--t2)">Sinal Avaliado:</span> ' + d.c2 + '<br><strong style="color:var(--pu)"><i data-lucide="check-circle" size="10"></i> ' + d.c3 + '</strong><br><span style="color:#777;font-size:10px">Referência: ' + d.ref + '</span></div>'
          + '<div style="width:50px;text-align:right;font-size:12px;font-weight:700;color:var(--rd);margin-top:4px">' + d.d + '</div>'
          + '<div style="width:60px;text-align:center"><span class="risk-chip ' + d.r + '" style="margin-top:2px">' + d.r + '</span></div>'
          + '</div>'
          + '<div style="width:100%;margin-top:8px;padding-top:8px;border-top:1px dashed var(--bd);color:#5E5E5E;font-size:11px;line-height:1.4"><i data-lucide="info" size="10" style="margin-right:4px;color:var(--pu)"></i>' + d.x + '</div>'
          + '</div>';
      }).join('');

      var box = document.createElement('div');
      box.innerHTML = '<div class="phase-section" style="margin-top:10px">'
        + '<div style="display:flex;gap:10px;font-size:10px;font-weight:800;color:var(--t2);text-transform:uppercase;padding:0 14px;margin-bottom:6px">'
        + '<div style="width:140px">Dimensão</div><div style="flex:1">Sinal Interno & Avaliação</div><div style="width:50px;text-align:right">Delta</div><div style="width:60px;text-align:center">Risco</div></div>'
        + '<div style="max-height:360px;overflow-y:auto;border:1px solid var(--bd);border-radius:12px">' + rows + '</div>'
        + '<div class="phase-section-title" style="margin-top:16px">&#128200; An&aacute;lise Qualitativa de Política</div>'
        + '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">'
        + '<div style="background:#E8F5E9; border:1px solid #C8E6C9; padding:12px; border-radius:8px;">'
        + '<div style="font-size:10px; font-weight:800; color:#2E7D32; text-transform:uppercase; margin-bottom:6px">&#43; Fundamentação Positiva</div>'
        + '<ul style="margin:0; padding-left:14px; font-size:10.5px; color:#1B5E20; line-height:1.4">'
        + '<li>Aplica governança na recomendação.</li>'
        + '<li>Mostra impacto prático em operação.</li>'
        + '</ul>'
        + '</div>'
        + '<div style="background:#FFEBEE; border:1px solid #FFCDD2; padding:12px; border-radius:8px;">'
        + '<div style="font-size:10px; font-weight:800; color:#C62828; text-transform:uppercase; margin-bottom:6px">&#45; Riscos Negativos</div>'
        + '<ul style="margin:0; padding-left:14px; font-size:10.5px; color:#B71C1C; line-height:1.4">'
        + '<li>Dependência recorrente de licença eleva TCO.</li>'
        + '<li>Exceções sem justificativa afetam compliance.</li>'
        + '</ul>'
        + '</div>'
        + '</div>'
        + '</div>';

      mbd.appendChild(box);
      lucide.createIcons();
      btn.innerHTML = origHtml;
    }


    /* =================== CASE 4: JEQUITI LIVE 14/03 =================== */
    function jeqcrd(b) {
      var el = document.createElement('div');
      el.className = 'ec';
      el.innerHTML = `<div class="ech">
        <h3><i data-lucide="brain-circuit" size="15"></i>Parecer Executivo de Execução e Potencial Comercial</h3>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="badge" style="background:#FFF3CD;color:#FF8C00;border:1px solid #FFEEDB">Prioridade Alta</span>
        </div>
      </div><div class="ecb">
<p class="bt2"><strong>Diagnóstico e Parecer Executivo:</strong> Sim, a live de 14/03 pode ser estruturada com aderência ao padrão Jequiti + SBT, desde que as aprovações e áreas críticas sejam acionadas imediatamente para trabalharem sobre um fluxo centralizado com acompanhamento rigoroso de todos os pontos de governança detalhados no plano.</p>
<div style="background:#F0FDF4; border:1px solid #BBF7D0; color:#166534; padding:10px 14px; border-radius:8px; font-size:11.5px; margin-bottom:14px; display:flex; gap:8px; align-items:flex-start;">
  <i data-lucide="zap" size="14" style="color:#16A34A; margin-top:2px; flex-shrink:0;"></i>
  <div><strong>Salto de Eficiência:</strong> O planejamento de uma Jequiti Live, que tradicionalmente leva <strong>30 dias de alinhamento fragmentado</strong>, foi estruturado e teve seus gatilhos operacionais centralizados em tempo real pela IA, garantindo escalabilidade comercial rápida para a data de 14/03.</div>
</div>
<div class="kg">
<div class="kb"><div class="kl">Complexidade Operacional</div><div class="kv" style="color:orange">Alta</div><div class="ks">Depende de múltiplas áreas e fluxo sincronizado</div></div>
<div class="kb"><div class="kl">Potencial Comercial Estimado</div><div class="kv g">Alto</div><div class="ks">Impulsionado por mix, desconto e transmissão ao vivo</div></div>
<div class="kb"><div class="kl">Risco de Execução sem Orquestração</div><div class="kv r">Crítico</div><div class="ks">Falhas de alinhamento afetam padrão e resultado</div></div>
</div>
<div class="sdv">Recomendação</div>
<p class="bt2">&#10003; <strong>Centralizar o plano da live</strong> em uma trilha única com responsáveis, prazos e dependências comunicadas, evitando informais e informação dispersa.<br>&#10003; <strong>Definir o mix</strong> com foco em produtos de maior apelo comercial, desconto calibrado e mecânica promocional simples.<br>&#10003; <strong>Priorizar influenciador</strong> com aderência comprovada à categoria foco da live, capacidade de conversão e encaixe com a Jequiti.</p>
<div class="acts">
<button class="btn bp" id="btn-run-jeq" onclick="openRunJeq(this)"><i data-lucide="route" size="14"></i> Criar Plano de Execução</button>
<button class="btn bpu" id="btn-sch-jeq" onclick="openScheduler(this,'jeq')"><i data-lucide="calendar" size="14"></i> Agendar Comitê</button>
<button class="btn bpu" id="btn-det-jeq" onclick="openDetailJeq(this)"><i data-lucide="zoom-in" size="14"></i> Detalhar Análise</button>
<button class="btn bgr silvio-shine" onclick="openSilvio('jequiti')"><i data-lucide="mic" size="14"></i> Visão Executiva</button>
</div>
<div class="sched-area"></div>
</div>`;
      b.appendChild(el);
      lucide.createIcons();
    }

    /* =================== PLANO DE EXECUÇÃO JEQUITI LIVE =================== */
    window.runJeqMan = function (id) {
      var d = document.getElementById(id + '_man');
      d.style.display = d.style.display === 'none' ? 'block' : 'none';
    };

    window.runJeqAgent = async function (id, color) {
      document.getElementById(id + '_btns').style.display = 'none';
      document.getElementById(id + '_man').style.display = 'none';
      var doneEl = document.getElementById(id + '_done');
      doneEl.style.display = 'flex';
      doneEl.innerHTML = '<div class="si sp" style="border-width:2px;border-color:var(--bd);border-top-color:' + color + ';width:14px;height:14px"></div> <span style="color:var(--t2)">Orquestrando integrações via IA...</span>';
      await dl(1200);
      doneEl.innerHTML = '<i data-lucide="check-circle" size="14" style="color:' + color + '"></i> <span style="color:' + color + '">Trilha executada pelo Agente e integrada ao ecossistema.</span>';
      lucide.createIcons();
    };

    window.runJeqSearch = async function (id) {
      document.getElementById(id + '_btns').style.display = 'none';
      document.getElementById(id + '_man').style.display = 'none';
      var doneEl = document.getElementById(id + '_done');
      doneEl.style.display = 'flex';
      doneEl.style.flexDirection = 'column';
      doneEl.style.alignItems = 'flex-start';
      doneEl.innerHTML = '<div style="display:flex;align-items:center;gap:6px"><div class="si sp" style="border-width:2px;border-color:var(--bd);border-top-color:#0284C7;width:14px;height:14px"></div> <span style="color:var(--t2)">Agente pesquisando na base de conhecimento interna...</span></div>';
      await dl(1500);
      doneEl.innerHTML = '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px"><i data-lucide="file-search" size="14" style="color:#0284C7"></i> <span style="color:#0284C7">Procedimento PR-EST-012 (Reserva de Estúdios e Locação) localizado e interpretado.</span></div>' +
        '<div style="width:100%;background:#F0F9FF;border:1px dashed #BAE6FD;padding:10px;border-radius:6px;color:#0369A1;font-size:11px;font-weight:normal">' +
        '<strong>Documentos necessários gerados:</strong><br>' +
        '<div style="margin-top:6px;display:flex;flex-direction:column;gap:6px">' +
        '<div style="display:flex;align-items:center;justify-content:space-between"><a href="#" style="color:#0284C7;text-decoration:none;display:flex;align-items:center;gap:4px"><i data-lucide="file-spreadsheet" size="12"></i> <span>Formulario_Reserva_Estudio_SBT.xlsx</span></a> <a href="#" style="color:#0369A1;text-decoration:underline;font-size:10px"><i data-lucide="info" size="10"></i> Manual de Preenchimento</a></div>' +
        '</div>' +
        '<div style="margin-top:10px;padding-top:10px;border-top:1px solid #BAE6FD"><strong>Pontos de Atenção (Política de Reserva):</strong><ul style="margin-top:4px;padding-left:14px;display:flex;flex-direction:column;gap:4px;font-size:10px">' +
        '<li>A prioridade de estúdio é da grade comercial diária do SBT; transmissões atípicas requerem aprovação diretiva.</li>' +
        '<li>O estúdio deve ser desbloqueado para montagem de cenografia e luz com mínimo de 3 horas de antecedência.</li>' +
        '<li>A equipe de produção deve constar na ficha de locação para liberação de acesso na portaria principal.</li>' +
        '<li>Cancelamentos sem oneração do CCD (Centro de Custos) devem ser comunicados com 72h de antecedência.</li></ul></div>' +
        '<div style="margin-top:10px;padding-top:10px;border-top:1px solid #BAE6FD"><strong>Próximo passo:</strong> <a href="#" style="color:#0284C7;font-weight:bold;text-decoration:underline">Abrir chamado no Top Desk</a> anexando o formulário para garantir a locação do evento no sábado.</div>' +
        '</div>';
      lucide.createIcons();
    };

    window.runJeqEmail = async function(id) {
      document.getElementById(id + '_btns').style.display = 'none';
      document.getElementById(id + '_man').style.display = 'none';
      var doneEl = document.getElementById(id + '_done');
      doneEl.style.display = 'flex';
      doneEl.style.flexDirection = 'column';
      doneEl.style.alignItems = 'flex-start';
      doneEl.innerHTML = '<div style="display:flex;align-items:center;gap:6px"><div class="si sp" style="border-width:2px;border-color:var(--bd);border-top-color:#16A34A;width:14px;height:14px"></div> <span style="color:var(--t2)">Gerando minuta e enviando e-mail...</span></div>';
      await dl(1200);
      doneEl.innerHTML = '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px"><i data-lucide="mail-check" size="14" style="color:#16A34A"></i> <span style="color:#16A34A">Comunicação disparada aos assessores e diretoria de arte.</span></div>' +
        '<div style="width:100%;background:#F0FDF4;border:1px dashed #BBF7D0;padding:10px;border-radius:6px;color:#166534;font-size:11px;font-weight:normal">' +
        '<strong>Assunto:</strong> [AÇÃO URGENTE] Reserva de Agenda + Início de Cenografia (Jequiti Live 14/03)<br>' +
        '<strong>Para:</strong> assessoria.patricia@sbt.com.br, direcao.arte@sbt.com.br...<br><br>' +
        '<div style="background:#fff;padding:8px;border:1px solid #DCFCE7;border-radius:4px;color:#15803D;line-height:1.4">' +
        'Prezados,<br><br>Gostaríamos de formalizar o pré-bloqueio de agenda para Patrícia, Rebeca e Lindezo no dia 14/03 a partir das 11h (Maquiagem) para o especial <strong>Jequiti Live</strong> (15h às 16h no Estúdio 3).<br><br>Atrelada a esta aprovação, autorizamos a imediata confecção dos budgets para Piscina de Bolinhas e Jogo de Cartas. Favor retornar no workflow.</div>' +
        '</div>';
      lucide.createIcons();
    };

    async function openRunJeq(btn) {
      if (btn.dataset.open) return;
      btn.dataset.open = '1';
      var uid = 'runjeq_' + Date.now();

      var mbd = createModal('Plano de Execução Tático', '<span class="badge" style="background:#FFF3CD;color:#FF8C00">Orquestração Assistida</span>');
      document.getElementById('bds-modal').dataset.sourceBtnId = btn.id;

      mbd.innerHTML = '<div class="sim-c"><h4><i data-lucide="route" size="14"></i> Fluxo de Execução - Jequiti Live</h4><div style="font-size:11.5px;color:var(--t2);margin-bottom:14px;line-height:1.4">O Baú do Saber mapeou que uma Jequiti Live <strong>tradicionalmente leva 30 dias de alinhamento fragmentado</strong>. Escolha abaixo quais frentes delegar para aceleração inteligente e quais seguir com manual de diretrizes.</div><div id="' + uid + '_stps" style="display:flex;flex-direction:column;gap:8px" class="roadmap-stps"></div></div>';
      lucide.createIcons();

      var rContainer = document.getElementById(uid + '_stps');
      var rSteps = [
        { t: 'Reserva de Grade (14/03 15h) e Trilha de Produção nos Estúdios SBT.', c: '#2563EB', src: 'Programação e Operações', man: '<strong>Diretriz Manual:</strong> Abrir chamado no portal de estúdios e redigir ofício para o diretor de TV solicitando a viabilidade do horário e estúdio.' },
        { t: 'Gerar formulários de Infraestrutura, Segurança e Agendamento de Artistas.', c: '#0284C7', src: 'Infraestrutura e Eventos', man: '<strong>Diretriz Manual:</strong> Preencher Checklist de Segurança, baixar formulários na intranet e abrir chamado no Top Desk solicitando apoio físico.' },
        { t: 'Aprovar Cenários/Figurinos e Disparar notificações ao elenco principal (Patrícia/Rebeca/Lindezo).', c: '#16A34A', src: 'Talentos e Direção de Arte', man: '<strong>Diretriz Manual:</strong> Checar agendas outlook, redigir briefings de piscina de bolinhas/cartas no sistemaCompras, e confirmar presença via assessoria.' },
        { t: 'Alinhar Ofertas E-Commerce, Influenciadores da Marca e Compliance (Sorteios).', c: '#EA580C', src: 'Comercial e Governança', man: '<strong>Diretriz Manual:</strong> Exportar listagem de SKUs do ERP, tabelar descontos, montar lista de influenciadores, e pautar dinâmica promocional no Comitê Jurídico via ata física.' }
      ];

      for (let i = 0; i < rSteps.length; i++) {
        let s = rSteps[i];
        let el = document.createElement('div');
        el.className = 'stp';
        el.style.alignItems = 'flex-start';
        el.style.flexDirection = 'column';
        el.style.background = '#fff';
        el.style.border = '1px solid var(--bd)';
        el.style.padding = '12px';
        el.style.borderRadius = '8px';

        let uidAction = uid + '_act_' + i;

        let actHtml = `<button class="btn bp" style="flex:1; padding:6px; font-size:11px" onclick="runJeqAgent('${uidAction}', '${s.c}')"><i data-lucide="bot" size="12"></i> Agente Executar</button>`;

        if (i === 0) { // Estúdios let it search
          actHtml = `<button class="btn bp" style="flex:1; padding:6px; font-size:11px; background:#0284C7; color:#fff" onclick="runJeqSearch('${uidAction}')"><i data-lucide="file-search" size="12"></i> Pesquisar Procedimento</button>`;
        }
        
        if (i === 2) { // Talentos let it email
          actHtml = `<button class="btn bp" style="flex:1; padding:6px; font-size:11px; background:#16A34A; color:#fff" onclick="runJeqEmail('${uidAction}')"><i data-lucide="mail" size="12"></i> Enviar E-mail de Aviso</button>`;
        }

        el.innerHTML = `
          <div style="display:flex; align-items:flex-start; width:100%; gap:10px">
            <div class="si" style="border:2px solid ${s.c}; color:${s.c}; font-weight:bold; background:#fff">!</div>
            <div style="flex:1">
              <div style="font-weight:700;color:var(--t1);font-size:12px;line-height:1.3">${s.t}</div>
              <div style="font-size:10px;color:var(--t2);margin-top:2px">Dependência: <strong>${s.src}</strong></div>
            </div>
          </div>
          <div id="${uidAction}_btns" style="display:flex; gap:8px; margin-top:12px; width:100%">
            ${actHtml}
            <button class="btn bpu" style="flex:1; padding:6px; font-size:11px" onclick="runJeqMan('${uidAction}')"><i data-lucide="book-open" size="12"></i> Fazer Manualmente</button>
          </div>
          <div id="${uidAction}_man" style="display:none; margin-top:10px; padding:10px; background:#F9F9F9; border:1px dashed var(--bd); border-radius:6px; font-size:11px; color:var(--t2); line-height:1.4">
            ${s.man}
          </div>
          <div id="${uidAction}_done" style="display:none; margin-top:10px; font-size:11px; color:${s.c}; font-weight:600; align-items:center; gap:6px">
          </div>
        `;
        rContainer.appendChild(el);
      }
      lucide.createIcons();
      sb2(mbd);
    }

    /* =================== DETALHAR JEQUITI LIVE =================== */
    window.openDetailJeq = async function (btn) {
      if (btn.dataset.open) return;
      btn.dataset.open = '1';
      var origHtml = btn.innerHTML;
      btn.innerHTML = '<div class="si sp" style="border-width:2px;width:16px;height:16px;flex-shrink:0"></div> Analisando...';

      var mbd = createModal('Plano Integrado da Live com Dados Internos e Sinais Externos', '<span class="badge" style="background:#E3F0FF;color:#002855">Visão 360°</span>');
      document.getElementById('bds-modal').dataset.sourceBtnId = btn.id;

      var JEQ_DATA = [
        { c1: 'Produção e Operação', c2: 'Padrão Jequiti + SBT, estúdio, cenário, figurino, jogos e equipe', c3: 'Abrir trilha de produção e validar cronograma detalhado com todas as áreas', ref: 'Produção / Operação / SBT', d: 'Alta Dependência', r: 'alto', x: 'Sem centralização do fluxo operacional, a live perde padrão, previsibilidade e qualidade de execução.' },
        { c1: 'Comercial e Mix', c2: 'Mix de produtos oferecidos X profundidade de desconto', c3: 'Otimizar o <strong>volume de vendas</strong> baseado nestes indicadores <strong>adicionado à potência do programa de TV ao vivo</strong>', ref: 'Comercial / E-commerce', d: 'Alta Sensibilidade', r: 'medio', x: 'O resultado depende diretamente do equilíbrio entre desejo do público, preço percebido e escala de audiência.' },
        { c1: 'Influenciador e Mercado', c2: 'Aderência entre creator, categoria, linguagem e sentimento público', c3: 'Garantir seleção de um <strong>influenciador cruzado com a aderência ao portfólio foco da Jequiti</strong>', ref: 'Marketing / Influência', d: 'Variação de Conversão', r: 'medio', x: 'A escolha do nome errado pode reduzir conexão com a audiência e enfraquecer a narrativa comercial ao vivo.' }
      ];

      var rows = JEQ_DATA.map(function (d) {
        return '<div class="phase-row" style="padding:10px 14px;border-bottom:1px solid var(--bd);flex-wrap:wrap;align-items:flex-start">'
          + '<div style="display:flex;width:100%;gap:10px">'
          + '<div style="width:140px;font-weight:700;font-size:12.5px;color:var(--bl)">' + d.c1 + '</div>'
          + '<div style="flex:1;font-size:11px;color:var(--t1)"><span style="color:var(--t2)">Dado/Entrada:</span> ' + d.c2 + '<br><strong style="color:var(--pu)"><i data-lucide="check-square" size="10"></i> ' + d.c3 + '</strong><br><span style="color:#777;font-size:10px">Responsável: ' + d.ref + '</span></div>'
          + '<div style="width:70px;text-align:right;font-size:11px;font-weight:700;color:var(--rd);margin-top:4px">' + d.d + '</div>'
          + '<div style="width:60px;text-align:center"><span class="risk-chip ' + d.r + '" style="margin-top:2px">' + d.r + '</span></div>'
          + '</div>'
          + '<div style="width:100%;margin-top:8px;padding-top:8px;border-top:1px dashed var(--bd);color:#5E5E5E;font-size:11px;line-height:1.4"><i data-lucide="info" size="10" style="margin-right:4px;color:var(--pu)"></i>' + d.x + '</div>'
          + '</div>';
      }).join('');

      var box = document.createElement('div');
      box.innerHTML = '<div class="phase-section" style="margin-top:10px">'
        + '<div style="display:flex;gap:10px;font-size:10px;font-weight:800;color:var(--t2);text-transform:uppercase;padding:0 14px;margin-bottom:6px">'
        + '<div style="width:140px">Frente</div><div style="flex:1">Dado & Ação Necessária</div><div style="width:70px;text-align:right">Delta</div><div style="width:60px;text-align:center">Risco</div></div>'
        + '<div style="max-height:300px;overflow-y:auto;border:1px solid var(--bd);border-radius:12px">' + rows + '</div>'
        + '<div class="phase-section-title" style="margin-top:16px">&#128200; An&aacute;lise Qualitativa de Orquestração</div>'
        + '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">'
        + '<div style="background:#E8F5E9; border:1px solid #C8E6C9; padding:12px; border-radius:8px;">'
        + '<div style="font-size:10px; font-weight:800; color:#2E7D32; text-transform:uppercase; margin-bottom:6px">&#43; Fundamentação Positiva</div>'
        + '<ul style="margin:0; padding-left:14px; font-size:10.5px; color:#1B5E20; line-height:1.4">'
        + '<li>Transforma conhecimento interno em fluxo acionável.</li>'
        + '<li>Enriquece operação com leitura externa de mercado.</li>'
        + '</ul>'
        + '</div>'
        + '<div style="background:#FFEBEE; border:1px solid #FFCDD2; padding:12px; border-radius:8px;">'
        + '<div style="font-size:10px; font-weight:800; color:#C62828; text-transform:uppercase; margin-bottom:6px">&#45; Riscos Negativos</div>'
        + '<ul style="margin:0; padding-left:14px; font-size:10.5px; color:#B71C1C; line-height:1.4">'
        + '<li>Atrasos caso áreas não respondam de forma centralizada.</li>'
        + '<li>Baixa aderência entre influenciador e produto reduz conversão.</li>'
        + '</ul>'
        + '</div>'
        + '</div>'
        + '</div>';

      mbd.appendChild(box);
      lucide.createIcons();
      btn.innerHTML = origHtml;
    }

    function xcrd(b) { var el = document.createElement('div'); el.className = 'ec'; el.innerHTML = `<div class="ech"><h3><i data-lucide="cpu" size="15"></i>Ba&uacute; do Saber</h3></div><div class="ecb"><p class="bt2">Selecione um dos 4 casos para ver o parecer executivo detalhado.</p><div class="acts"><button class="btn bp" onclick="go('pricing')">&#9917; Copa 2026</button><button class="btn bo" onclick="go('cenografia')">&#127748; Cenografia</button><button class="btn bo" onclick="go('gov')"><i data-lucide="shield-check" size="14" style="color:var(--pu)"></i> Aprova&ccedil;&atilde;o de Verba</button><button class="btn bo" onclick="go('jequiti')">&#128144; Jequiti Live</button></div></div>`; b.appendChild(el); lucide.createIcons(); }

    /* =================== MODO SILVIO — Personalidade Executiva =================== */
    function openSilvio(mode) {
      var m = mode || currentMode;
      var mbd = createModal('Parecer do Patr&atilde;o', '<span class="badge bpu">Vis&atilde;o Executiva GSS</span>');
      var content = {
        pricing: {
          slogan: "A pergunta que eu faço é: encontramos a equação para esses 68 milhões?",
          text: "Veja bem, se o mercado está pagando mais, a gente precisa revisar esse CPM agora. Sinceramente, deixar dinheiro na mesa não é lógico para um bom negócio. O que eu quero é que o setor privado valorize o nosso espaço. Vamos resolver isso com inteligência.",
          verdict: "Revisar tabela premium para capturar o ágio de mercado."
        },
        cenografia: {
          slogan: "Sinceramente, eficiência é a alma do negócio.",
          text: "Se a gente tem o material no galpão, por que vamos comprar novo? Não é lógico. O que eu quero é viabilizar a troca e o reuso. Luiz Torres deu o caminho, então vamos seguir a técnica. O lucro vem de não gastar o que não precisa.",
          verdict: "Aprovar plano de reuso e bloquear compras redundantes."
        },
        gov: {
          slogan: "Não é um chat. É inteligência governada sobre dados internos críticos.",
          text: "Em um cenário de aprovação de verba, a solução não apenas responde perguntas. Ela investiga o contexto com base em dados internos proprietários, políticas corporativas e sinais operacionais reais. Um agente de análise de impacto mede os efeitos sobre a operação. A entrega final é uma recomendação priorizada, explicável e rastreável.",
          verdict: "Aprovar com condicionantes formais de política, proteção e provisão."
        },
        jequiti: {
          slogan: "Não é apenas organizar uma live. É transformar conhecimento interno em execução coordenada com inteligência comercial.",
          text: "A solução não atua como um chat reativo. Ela organiza o padrão interno Jequiti + SBT, traduz dependências operacionais em ações concretas, distribui responsabilidades entre as áreas corretas e ainda cruza informações de mercado e percepção do público para recomendar a melhor configuração da live. O valor está em reduzir dependência de conhecimento informal, acelerar alinhamento e melhorar a qualidade da decisão comercial e operacional.",
          verdict: "Seguir com a live de 14/03 com orquestração centralizada, priorização imediata das frentes críticas, mix de alta tração e escolha de influenciador orientada por aderência e potencial de conversão."
        }
      };

      var d = content[m] || { slogan: "A pergunta que eu faço é...", text: "Vamos encontrar uma equação para esse negócio. Decida na hora!", verdict: "Prosseguir com análise." };

      mbd.innerHTML = `
        <div style="background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 28px; border-radius: 20px; color: #1a1a1a; border: 1px solid rgba(255,255,255,0.4); box-shadow: 0 8px 32px rgba(0,0,0,0.08); margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
            <div style="width: 48px; height: 48px; background: rgba(0, 135, 81, 0.1); border-radius: 14px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(0, 135, 81, 0.2)">
              <i data-lucide="mic" size="24" style="color: var(--gr)"></i>
            </div>
            <div>
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #666; margin-bottom: 4px; font-weight: 600;">Vis&atilde;o Executiva</div>
              <h4 style="font-size: 19px; font-weight: 800; margin: 0; color: #111; line-height: 1.2;">${d.slogan}</h4>
            </div>
          </div>
          <div style="position: relative; padding: 20px; background: rgba(255,255,255,0.5); border-radius: 12px; margin-bottom: 24px; border-left: 3px solid var(--gr)">
            <p style="font-style: italic; font-size: 15px; line-height: 1.7; color: #333; margin: 0;">
              "${d.text}"
            </p>
          </div>
          <div style="border-top: 1px solid rgba(0,0,0,0.06); padding-top: 20px;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; font-weight: 600;">Veredito do Patr&atilde;o</div>
            <div style="font-size: 17px; font-weight: 700; color: var(--gr); display: flex; align-items: center; gap: 8px;">
              <i data-lucide="check-circle" size="18"></i> ${d.verdict}
            </div>
          </div>
        </div>
        <div id="silvio-extra" style="margin-bottom: 12px;"></div>
        <button class="btn bgr" style="width: 100%; justify-content: center; padding: 14px; font-weight: 700; border-radius: 12px;" onclick="closeModal()">Entendido, Patr&atilde;o!</button>
      `;
      lucide.createIcons();
      if (m === 'pricing' || m === 'cenografia' || m === 'gov' || m === 'jequiti') {
        var extra = mbd.querySelector('#silvio-extra');
        var abtn = document.createElement('button');
        abtn.className = 'btn bo';
        abtn.style.width = '100%';
        abtn.style.justifyContent = 'center';
        abtn.id = 'btn-audio-silvio';
        abtn.innerHTML = '<i data-lucide="volume-2" size="14"></i> Ouvir &aacute;udio';
        extra.appendChild(abtn);

        var src = '';
        if (m === 'pricing') src = 'voz_Silvio_2.mp3';
        else if (m === 'cenografia') src = 'voz_Silvio_1.mp3';
        else if (m === 'gov') src = 'parecer_aprovacao_governada_led.mp3';
        else if (m === 'jequiti') src = 'jequiti_live_1403_parecer.mp3';

        var audio = new Audio(src);
        abtn.onclick = function () { if (audio.paused) { audio.play(); abtn.innerHTML = '<i data-lucide="pause" size="14"></i> Pausar &aacute;udio'; } else { audio.pause(); audio.currentTime = 0; abtn.innerHTML = '<i data-lucide="volume-2" size="14"></i> Ouvir &aacute;udio'; } lucide.createIcons(); };
        audio.onended = function () { abtn.innerHTML = '<i data-lucide="volume-2" size="14"></i> Ouvir &aacute;udio'; lucide.createIcons(); };
        lucide.createIcons();
      }
    }

    /* =================== SIMULATOR ===================
     * openSim(btn) — Abre o simulador de receita (somente no case Copa/pricing).
     *   - Usa criarModal() para renderizar numa caixa centralizada.
     *   - btn.dataset.open evita dupla abertura enfileirada.
     */
    function openSim(btn) {
      if (btn.dataset.open) return;
      btn.dataset.open = '1';
      var uid = 'sim_' + Date.now();
      var mbd = createModal('Simular Receita Copa 2026', '<span class="badge bgrn">Teto Potencial: R$ 68M</span>');
      document.getElementById('bds-modal').dataset.sourceBtnId = btn.id;

      mbd.innerHTML = '<div class="sim-c"><h4><i data-lucide="sliders" size="14"></i> Ajuste Analítico de Inventário</h4><label style="font-size:12.5px;font-weight:700;display:flex;justify-content:space-between;margin-bottom:6px">Breaks com CPM revisado (+20%) <span id="' + uid + '_sv">60</span>%</label><input type="range" min="0" max="100" value="60" style="width:100%;accent-color:var(--bl);margin-bottom:12px" oninput="updS(this.value,\'' + uid + '\')"><div class="sr"><div class="sl3">Receita Incremental Projetada</div><div class="sv" id="' + uid + '_sv2" style="transition:color 0.3s ease">+R$ 40.8M</div><div style="font-size:11px;color:var(--t2);margin-top:3px">Acima da proje&ccedil;&atilde;o base de R$ 310M</div></div><div id="' + uid + '_summary" style="margin-top:14px;font-size:11.5px;color:var(--t2);padding:10px;background:#F8F9FA;border-radius:8px;border:1px solid var(--bd);line-height:1.4"><strong style="color:var(--pu)">Crescimento Orgânico:</strong> Receita adicional segura, mas espaço reprimido para upsell.</div></div>';
      lucide.createIcons();
    }
    function updS(v, uid) {
      var result = (68 * v / 100).toFixed(1);
      var sv = document.getElementById(uid + '_sv');
      var sv2 = document.getElementById(uid + '_sv2');
      var sum = document.getElementById(uid + '_summary');

      sv.textContent = v;
      sv2.textContent = '+R$ ' + result + 'M';

      if (v < 40) {
        sv2.style.color = '#D62828';
        sum.innerHTML = '<strong style="color:#D62828">Risco de Déficit:</strong> Margem insuficiente para cobrir meta de investimento do projeto.';
      } else if (v <= 65) {
        sv2.style.color = 'var(--pu)';
        sum.innerHTML = '<strong style="color:var(--pu)">Crescimento Orgânico:</strong> Receita adicional segura, mas espaço reprimido para upsell.';
      } else if (v <= 80) {
        sv2.style.color = '#008060';
        sum.innerHTML = '<strong style="color:#008060">Decisão Otimizada!</strong> Maximiza o ROI e o faturamento sem atrito no mercado atual.';
      } else if (v <= 90) {
        sv2.style.color = '#D97706';
        sum.innerHTML = '<strong style="color:#D97706">Alerta de Fuga:</strong> Ágio agressivo. Pode afastar anunciantes tradicionais e reduzir a ocupação.';
      } else {
        sv2.style.color = '#D62828';
        sum.innerHTML = '<strong style="color:#D62828">Risco Crítico:</strong> Valor inviável mercadologicamente. Ameaça a venda de cotas de patrocínio.';
      }
    }
    /* =================== SIMULATOR CENOGRAFIA =================== */
    function openSimCen(btn) {
      if (btn.dataset.open) return;
      btn.dataset.open = '1';
      var uid = 'simcen_' + Date.now();
      var mbd = createModal('Simular Risco Geopolítico', '<span class="badge bred">Budget: R$ 473k</span>');
      document.getElementById('bds-modal').dataset.sourceBtnId = btn.id;

      mbd.innerHTML = '<div class="sim-c"><h4><i data-lucide="shield-alert" size="14"></i> Stress Test: Escalada EUA x Irã</h4><label style="font-size:12.5px;font-weight:700;display:flex;justify-content:space-between;margin-bottom:6px">Risco de novo repasse (Frete/Óleo) <span id="' + uid + '_sv">0</span>%</label><input type="range" min="0" max="15" value="0" style="width:100%;accent-color:var(--rd);margin-bottom:12px" oninput="updSCen(this.value,\'' + uid + '\')"><div class="sr"><div class="sl3">Impacto Adicional Estimado</div><div class="sv" id="' + uid + '_sv2" style="transition:color 0.3s ease">+R$ 0</div><div style="font-size:11px;color:var(--t2);margin-top:3px">Sobre o orçamento já ajustado de R$ 473k</div></div><div id="' + uid + '_summary" style="margin-top:14px;font-size:11.5px;color:var(--t2);padding:10px;background:#F8F9FA;border-radius:8px;border:1px solid var(--bd);line-height:1.4"><strong style="color:var(--gr)">Cenário Estável:</strong> Impactos atuais absorvidos pelo SVE de R$ 39k.</div></div>';
      lucide.createIcons();
    }
    function updSCen(v, uid) {
      var extra = (473 * v / 100).toFixed(1);
      var sv = document.getElementById(uid + '_sv');
      var sv2 = document.getElementById(uid + '_sv2');
      var sum = document.getElementById(uid + '_summary');

      sv.textContent = v;
      sv2.textContent = '+R$ ' + extra + 'k';

      if (v == 0) {
        sv2.style.color = 'var(--gr)';
        sum.innerHTML = '<strong style="color:var(--gr)">Cenário Estável:</strong> Impactos atuais absorvidos pelo SVE de R$ 39k.';
      } else if (v <= 5) {
        sv2.style.color = 'var(--pu)';
        sum.innerHTML = '<strong style="color:var(--pu)">Risco Moderado:</strong> Requer contingenciamento de 5% em marcenaria/acabamentos.';
      } else if (v <= 10) {
        sv2.style.color = '#D97706';
        sum.innerHTML = '<strong style="color:#D97706">Alerta de Estouro:</strong> Rompe o teto da SVE. Necessário escalonamento para o CFO.';
      } else {
        sv2.style.color = '#D62828';
        sum.innerHTML = '<strong style="color:#D62828">Risco Crítico:</strong> Inviabiliza a Temporada 2026. Sugerido reuso radical de estruturas antigas.';
      }
    }

    /* =================== TEAMS MEMBERS ===================
     * MEMBERS[key] — Lista de participantes sugeridos por reunião.
     *   Cada membro: { i: 'iniciais', n: 'nome completo', r: 'cargo', c: '#cor-hex' }
     *   Chaves: copa | cen | grade | jeq
     *   Usado por openScheduler() e renderMeeting()
     *
     * AGENDAS[key] — Pauta pré-definida da reunião (texto livre), exibida no .ag-box
     *
     * MEETINGS[key] — Parâmetro ?meeting= para o link do Teams prototype
     *   Link gerado: gss-teams-prototype.html?meeting=<valor>
     */
    var MEMBERS = {
      copa: [{ i: 'RA', n: 'Ricardo Almeida', r: 'VP Comercial', c: '#002855' }, { i: 'PF', n: 'Patricia Fonseca', r: 'Diretora de M&iacute;dia', c: '#5B5FC7' }, { i: 'CM', n: 'Carlos Moura', r: 'Diretor Jur&iacute;dico', c: '#008751' }, { i: 'FC', n: 'Fernanda Costa', r: 'Diretora Digital (+SBT)', c: '#D32F2F' }, { i: 'AB', n: 'Ana Beatriz Lima', r: 'Ger. Estrat&eacute;gia Copa', c: '#F2A900' }],
      cen: [{ i: 'LT', n: 'Luiz Torres', r: 'Diretor de Produ&ccedil;&atilde;o', c: '#002855' }, { i: 'MS', n: 'Marina Souza', r: 'Ger. de Cenografia', c: '#5B5FC7' }, { i: 'RP', n: 'Roberto Pinheiro', r: 'Coord. de Compras', c: '#008751' }, { i: 'JA', n: 'Julia Ara&uacute;jo', r: 'Analista de Budget', c: '#D32F2F' }],
      gov: [{ i: 'DF', n: 'Diretor Financeiro', r: 'Financeiro', c: '#1D4ED8' }, { i: 'CP', n: 'Compliance e Pol&iacute;ticas', r: 'Governan&ccedil;a', c: '#7C3AED' }, { i: 'OP', n: 'Gest&atilde;o de Opera&ccedil;&atilde;o', r: 'Opera&ccedil;&atilde;o T&eacute;cnica', c: '#059669' }],
      jeq: [{ i: 'PR', n: 'Responsável de Produção da Live', r: 'Produção / Operação', c: '#2563EB' }, { i: 'CM', n: 'Responsável Comercial da Ação', r: 'Comercial / E-commerce', c: '#16A34A' }, { i: 'MK', n: 'Responsável por Marketing e Influência', r: 'Marketing / Conteúdo', c: '#EA580C' }]
    };
    var AGENDAS = {
      copa: 'Aprova&ccedil;&atilde;o de ajuste de CPM Copa 2026 + valida&ccedil;&atilde;o do Plano B Comercial + distributui&ccedil;&atilde;o cross-platform.',
      cen: 'Aprova&ccedil;&atilde;o emergencial de Verba Extra (SVE) motivada por choque externo (EUA x Ir&atilde;) + revis&atilde;o de BOM.',
      gov: 'Valida&ccedil;&atilde;o executiva da compra do painel LED, an&aacute;lise de ader&ecirc;ncia &agrave;s pol&iacute;ticas e impacto.',
      jeq: 'Kickoff executivo da Jequiti Live 14/03: validação do fluxo padrão Jequiti + SBT, acionamento das áreas críticas, definição de mix, desconto, influenciador e checkpoints de governança.'
    };
    var MEETINGS = { copa: 'copa2026', cen: 'cenografia', gov: 'comite-aprovacao-governada-led', jeq: 'kickoff-jequiti-live-1403' };

    /* MS Graph mock directory */
    var GRAPH_DIR = [
      { i: 'MN', n: 'Marcos Nunes', r: 'Dir. Financeiro GSS', c: '#6B2D8B' },
      { i: 'BL', n: 'Beatriz Lopes', r: 'Ger. Jur&iacute;dica', c: '#C76B00' },
      { i: 'TC', n: 'Thiago Castro', r: 'VP Tecnologia (TTI)', c: '#006B5B' },
      { i: 'KS', n: 'Karina Silva', r: 'Analista de BI', c: '#8B0000' },
      { i: 'WO', n: 'Wagner Oliveira', r: 'Coord. de M&iacute;dia', c: '#3D5A80' },
      { i: 'JM', n: 'Joana Melo', r: 'Ger. de Projetos', c: '#6B4226' }
    ];

    /* =================== SCHEDULER (with participant selector) =================== */
    function openScheduler(btn, key) {
      if (btn.dataset.open) return;
      btn.dataset.open = '1';
      var mbd = createModal('Agendar no Teams', '<span class="badge" style="background:#5B5FC7;color:#fff">Microsoft Teams</span>');
      document.getElementById('bds-modal').dataset.sourceBtnId = btn.id;

      var members = MEMBERS[key] || MEMBERS.copa;
      var checked = members.map(function (m, i) { return '<label style="display:flex;align-items:center;gap:10px;padding:8px;border:1px solid var(--bd);border-radius:10px;cursor:pointer;background:#fff;transition:background .15s" onmouseenter="this.style.background=\'var(--hv)\'" onmouseleave="this.style.background=\'#fff\'"><input type="checkbox" checked data-idx="' + i + '" style="width:16px;height:16px;accent-color:var(--pu);cursor:pointer"><div style="width:34px;height:34px;border-radius:50%;background:' + m.c + ';color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">' + m.i + '</div><div><div style="font-size:13px;font-weight:700">' + m.n + '</div><div style="font-size:11.5px;color:var(--t2)">' + m.r + '</div></div></label>'; }).join('');
      var uid = 'sched_' + Date.now();
      mbd.innerHTML = `
<div style="border:1px solid #C7D2F5;border-radius:12px;overflow:hidden">
<div style="background:var(--pu);color:#fff;padding:12px 16px;font-size:13px;font-weight:700;display:flex;align-items:center;gap:8px"><i data-lucide="users" size="15"></i>Configurar Reuni&atilde;o no Microsoft Teams</div>
<div style="padding:18px;background:#fff">
<div style="font-size:12px;font-weight:700;color:var(--t2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">Participantes Sugeridos pelo Ba&uacute; do Saber</div>
<div id="${uid}_list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px">${checked}</div>
<div style="background:#F0F4FF;border-radius:8px;padding:10px 12px;margin-bottom:14px">
<div style="font-size:11.5px;font-weight:700;color:var(--pu);display:flex;align-items:center;gap:6px;margin-bottom:8px"><i data-lucide="search" size="13"></i>Adicionar Pessoa via Microsoft Graph</div>
<div style="position:relative">
<input id="${uid}_search" type="text" placeholder="Buscar por nome ou e-mail..." style="width:100%;padding:8px 12px;border:1px solid var(--bd);border-radius:8px;font-size:13px;outline:none;font-family:inherit" oninput="graphSearch(this,'${uid}')">
<div id="${uid}_results" style="display:none;position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1px solid var(--bd);border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.1);z-index:100;overflow:hidden"></div>
</div>
</div>
<div id="${uid}_added" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px"></div>
<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
<label style="font-size:12.5px;font-weight:700;color:var(--t2)">Data e Hora Sugerida:</label>
<div style="background:#F8F9FA;border:1px solid var(--bd);border-radius:8px;padding:6px 12px;font-size:13px;font-weight:700;color:var(--bl)">&#128197; Amanh&atilde;, 14h00 &mdash; 60 min</div>
</div>
<button class="btn bpu" style="width:100%;justify-content:center" onclick="runSchedule(this,'${uid}','${key}')"><i data-lucide="send" size="14"></i>Confirmar e Agendar Automaticamente</button>
<div style="font-size:11px;color:var(--t2);text-align:center;margin-top:8px">&#128279; Conectado ao Microsoft Graph API &middot; Calend&aacute;rios verificados em tempo real</div>
</div></div>
<div id="${uid}_result" style="margin-top:16px"></div>`;
      lucide.createIcons();
    }

    function graphSearch(input, uid) {
      var v = input.value.trim().toLowerCase();
      var box = document.getElementById(uid + '_results');
      if (v.length < 2) { box.style.display = 'none'; return; }
      var matches = GRAPH_DIR.filter(function (p) { return p.n.toLowerCase().includes(v) || p.r.toLowerCase().includes(v) });
      if (!matches.length) { box.style.display = 'none'; return; }
      box.innerHTML = matches.map(function (p) {
        return '<div onclick="addPerson(\'' + uid + '\',\'' + p.i + '\',\'' + p.n + '\',\'' + p.r + '\',\'' + p.c + '\')" style="display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--bd);transition:background .15s" onmouseenter="this.style.background=\'var(--hv)\'" onmouseleave="this.style.background=\'\'"><div style="width:30px;height:30px;border-radius:50%;background:' + p.c + ';color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">' + p.i + '</div><div><div style="font-size:13px;font-weight:700">' + p.n + '</div><div style="font-size:11px;color:var(--t2)">' + p.r + ' &middot; Microsoft Graph</div></div></div>';
      }).join('');
      box.style.display = 'block';
    }

    function addPerson(uid, i, n, r, c) {
      document.getElementById(uid + '_results').style.display = 'none';
      document.getElementById(uid + '_search').value = '';
      var added = document.getElementById(uid + '_added');
      if (document.getElementById(uid + '_p_' + i)) return;
      var tag = document.createElement('div'); tag.id = uid + '_p_' + i;
      tag.style.cssText = 'display:inline-flex;align-items:center;gap:7px;padding:6px 10px;background:var(--hv);border:1px solid var(--bd);border-radius:20px;font-size:12.5px;font-weight:600';
      tag.innerHTML = '<div style="width:26px;height:26px;border-radius:50%;background:' + c + ';color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700">' + i + '</div>' + n + ' <span style="font-size:10px;color:var(--pu);font-weight:700">[Graph]</span> <span onclick="this.parentElement.remove()" style="cursor:pointer;color:var(--t2);margin-left:4px;font-size:16px;line-height:1">&times;</span>';
      added.appendChild(tag);
      var mbd = document.querySelector('.modal-bd');
      if (mbd) sb2(mbd);
    }

    async function runSchedule(btn, uid, key) {
      btn.disabled = true; btn.innerHTML = '<div class="si sp" style="border-width:2px;width:18px;height:18px"></div>Agendando...';
      var container = document.getElementById(uid + '_result');
      var tmSteps = [
        'Coletando participantes selecionados e adicionados via Microsoft Graph...',
        'Verificando disponibilidade de calend&aacute;rios (Microsoft Graph API)...',
        'Horario confirmado: Amanh&atilde;, 14h00 &mdash; todos dispon&iacute;veis...',
        'Criando evento no Microsoft Teams com link de videoconfer&ecirc;ncia...',
        'Convites enviados com pauta e contexto do Ba&uacute; do Saber!'
      ];
      var sd = document.createElement('div'); sd.className = 'tm-steps';
      sd.innerHTML = '<div class="tm-hd"><i data-lucide="loader" size="14"></i>Agendamento Autom&aacute;tico em Andamento...</div>';
      container.appendChild(sd); lucide.createIcons();
      for (var s of tmSteps) {
        var el = document.createElement('div'); el.className = 'stp';
        el.innerHTML = '<div class="si sp"></div><span>' + s + '</span>';
        sd.appendChild(el);
        var mbd = document.querySelector('.modal-bd');
        if (mbd) sb2(mbd);
        await dl(1400);
        el.className = 'stp dn'; el.innerHTML = '<div class="si ok">&#10003;</div><span>' + s + '</span>';
        if (mbd) sb2(mbd);
      }
      await dl(500);
      renderMeeting(container, key);
      var mbd = document.querySelector('.modal-bd');
      if (mbd) sb2(mbd);
      btn.innerHTML = '&#10003; Agendado com Sucesso';
    }

    function renderMeeting(container, key) {
      var members = MEMBERS[key] || MEMBERS.copa;
      var agenda = AGENDAS[key] || 'Pauta a definir.';
      var link = 'gss-teams-prototype.html?meeting=' + MEETINGS[key];
      var avs = members.map(function (m) { return '<div class="ptc"><div class="ptc-av" style="background:' + m.c + '">' + m.i + '</div><div class="ptc-nm">' + m.n.split(' ').slice(0, 2).join(' ') + '</div><div class="ptc-rg">' + m.r + '</div></div>'; }).join('');
      container.insertAdjacentHTML('beforeend', `<div class="mc"><div class="mc-hd"><h4><i data-lucide="video" size="15"></i>Reuni&atilde;o Agendada com Sucesso</h4><div class="mc-sub">Criado automaticamente pelo Ba&uacute; do Saber via Microsoft Graph</div></div><div class="mc-bd"><div class="mc-meta"><span><i data-lucide="calendar" size="13"></i>Amanh&atilde;, 14h00</span><span><i data-lucide="clock" size="13"></i>60 minutos</span><span><i data-lucide="users" size="13"></i>${members.length} participantes</span><span><i data-lucide="video" size="13"></i>Microsoft Teams</span></div><div class="ptcs">${avs}</div><div class="ag-box"><strong>Pauta:</strong> ${agenda}</div><div class="acts"><a class="btn bpu" href="${link}" target="_blank" style="width:100%;justify-content:center"><i data-lucide="external-link" size="14"></i>Abrir no Teams</a></div></div></div>`);
      lucide.createIcons();
    }

    /* =================== DETALHAR — Copa 2026 ===================
     * Dados estáticos de breakdown por fase e setor.
     * openDetail(btn) usa dataset.open como guard (evita dupla abertura).
     * Mini-flow de 3 steps com 700ms cada antes de revelar o breakdown.
     */
    var COPA_PHASES = [
      {
        fase: 'Fase de Grupos',
        breaks: { v: 72, src: 'ERP', ht: 'Invent&aacute;rio liberado', ex: false },
        cpmAtual: { v: 'R$ 48k', src: 'Financeiro', ht: 'Tabela Base', ex: false },
        cpmSug: { v: 'R$ 57k', src: 'Modelo GSS', ht: '+18% &aacute;gio Copa', ex: false },
        delta: { v: '+18%', src: 'C&aacute;lculo', ht: 'Reflete demanda', ex: false },
        risco: 'alto',
        expl: 'Maior volume de jogos atrai anunciantes de entrada. Alta competitividade justifica o ágio no CPM básico.'
      },
      {
        fase: 'Oitavas de Final',
        breaks: { v: 32, src: 'ERP', ht: 'Contrato A', ex: false },
        cpmAtual: { v: 'R$ 62k', src: 'CENP', ht: 'Tabela Base', ex: true },
        cpmSug: { v: 'R$ 77k', src: 'Modelo GSS', ht: '+24% m&aacute;x', ex: false },
        delta: { v: '+24%', src: 'C&aacute;lculo', ht: 'Premium slot', ex: false },
        risco: 'alto',
        expl: 'Transição chave. O público consolida e marcas exigem maior presença, permitindo teto máximo de ajuste.'
      },
      {
        fase: 'Quartas de Final',
        breaks: { v: 16, src: 'ERP', ht: 'Reserva OBR', ex: false },
        cpmAtual: { v: 'R$ 78k', src: 'Kantar', ht: 'Media Hist.', ex: true },
        cpmSug: { v: 'R$ 95k', src: 'Modelo GSS', ht: 'Ajuste final', ex: false },
        delta: { v: '+22%', src: 'C&aacute;lculo', ht: 'M&eacute;dia ponderada', ex: false },
        risco: 'medio',
        expl: 'Inventário reduzido. Foco em fidelizar patrocinadores master com pacotes fechados antes desta fase.'
      },
      {
        fase: 'Semi + Final',
        breaks: { v: 23, src: 'ERP', ht: '', ex: false },
        cpmAtual: { v: 'R$ 95k', src: 'Ibope', ht: 'Peak Hist.', ex: true },
        cpmSug: { v: 'R$ 118k', src: 'Modelo GSS', ht: 'Limiar mercado', ex: false },
        delta: { v: '+24%', src: 'C&aacute;lculo', ht: 'Leil&atilde;o Cotas', ex: false },
        risco: 'baixo',
        expl: 'Pico de audiência absoluta (Histórico da Seleção). Espaço de venda tipo leilão absorve repasses tarifários elevados sem atrito.'
      }
    ];

    var COPA_SECTORS = [
      { setor: 'Alimentos & Bebidas', prop: 92, cpm: 'R$ 62k' },
      { setor: 'Financeiro', prop: 78, cpm: 'R$ 58k' },
      { setor: 'Varejo', prop: 65, cpm: 'R$ 52k' }
    ];

    async function openDetail(btn) {
      if (btn.dataset.open) return;
      btn.dataset.open = '1';

      var origHtml = btn.innerHTML;
      btn.innerHTML = '<div class="si sp" style="border-width:2px;width:16px;height:16px;flex-shrink:0"></div> Detalhando...';

      var mbd = createModal('Detalhamento &mdash; Copa 2026', '<span class="badge bred">A&ccedil;&atilde;o Urgente</span>');
      document.getElementById('bds-modal').dataset.sourceBtnId = btn.id;

      /* ---- Mini-flow de aprofundamento ---- */
      var miniSteps = FLOWS.pricing;
      var sd = document.createElement('div'); sd.className = 'detail-mini-steps'; mbd.appendChild(sd);
      for (var s of miniSteps) {
        var el = document.createElement('div'); el.className = 'stp';
        el.innerHTML = '<div class="si sp"></div><div><span>' + s.t + '</span><div class="src-row">&#128279; Fonte: ' + s.s + '</div></div>';
        sd.appendChild(el); await dl(700);
        el.className = 'stp dn';
        el.innerHTML = '<div class="si ok">&#10003;</div><div><span>' + s.t + '</span><div class="src-row">&#128279; Fonte: ' + s.s + '</div></div>';
      }
      await dl(400);

      var tag = function (s, e) { return '<span style="display:inline-block;padding:1px 4px;border-radius:3px;font-size:8px;font-weight:800;text-transform:uppercase;margin-bottom:1px;background:' + (e ? '#FEF7E0' : '#E6F4EA') + ';color:' + (e ? '#B06000' : '#137333') + ';">' + s + '</span>'; };

      /* ---- Breakdown por Fase (Expandida com Fontes/Tags Pílula UX e Explicações) ---- */
      var phaseHtml = COPA_PHASES.map(function (p) {
        return '<div class="phase-row" style="align-items:center;padding-top:10px;padding-bottom:12px;flex-wrap:wrap">'
          + '<div style="display:flex;width:100%;align-items:center;gap:10px;">'
          + '<div class="phase-name" style="margin-top:2px">' + p.fase + '</div>'
          + '<div class="phase-breaks"><div>' + p.breaks.v + ' breaks</div><div style="margin-top:4px;display:flex;justify-content:center">' + tag(p.breaks.src, p.breaks.ex) + '</div></div>'
          + '<div class="phase-cpm-old"><div>' + p.cpmAtual.v + '</div><div style="margin-top:4px;display:flex;justify-content:center">' + tag(p.cpmAtual.src, p.cpmAtual.ex) + '</div></div>'
          + '<div class="phase-cpm-new"><div>' + p.cpmSug.v + '</div><div style="margin-top:4px;display:flex;justify-content:center">' + tag(p.cpmSug.src, p.cpmSug.ex) + '</div></div>'
          + '<div class="phase-delta"><div>' + p.delta.v + '</div><div style="margin-top:4px;display:flex;justify-content:center">' + tag(p.delta.src, p.delta.ex) + '</div></div>'
          + '<div style="width:52px;text-align:center"><span class="risk-chip ' + p.risco + '" style="margin-top:2px">' + p.risco + '</span></div>'
          + '</div>'
          + '<div style="width:100%;margin-top:6px;padding-top:6px;border-top:1px dashed var(--bd);color:var(--t2);font-size:10.5px;line-height:1.4;display:flex;align-items:center"><i data-lucide="info" size="7" style="margin-right:4px;color:var(--pu);flex-shrink:0"></i>' + p.expl + '</div>'
          + '</div>';
      }).join('');

      /* ---- Breakdown por Setor ---- */
      var sectorHtml = COPA_SECTORS.map(function (s) {
        return '<div class="sector-row">'
          + '<div class="sector-name">' + s.setor + '</div>'
          + '<div class="sector-bar-wrap"><div class="sector-bar-fill" style="width:0%" data-w="' + s.prop + '%"></div></div>'
          + '<div class="sector-cpm">' + s.cpm + '</div>'
          + '</div>';
      }).join('');

      var box = document.createElement('div');
      box.innerHTML = '<div class="ec" style="border:none;box-shadow:none;padding:0">'
        + '<div class="ecb" style="padding:0">'
        + '<div class="phase-section">'
        + '<div class="phase-section-title">&#9917; Breakdown por Fase</div>'
        + '<div style="display:flex;gap:6px;font-size:10.5px;font-weight:700;color:var(--t2);padding:0 14px;margin-bottom:4px">'
        + '<div style="flex:1">Fase</div><div style="width:48px;text-align:center">Breaks</div>'
        + '<div style="width:68px;text-align:center">CPM Atual</div><div style="width:68px;text-align:center">CPM Sug.</div>'
        + '<div style="width:48px;text-align:center">Delta</div><div style="width:52px;text-align:center">Risco</div></div>'
        + '<div class="phase-table">' + phaseHtml + '</div>'
        + '</div>'
        + '<div class="phase-section">'
        + '<div class="phase-section-title">&#11088; Estrat&eacute;gia de Talentos e Web Insight</div>'
        + '<div style="background:#F0F4FF; border:1px solid #C7D2F5; border-radius:10px; padding:14px; margin-bottom:12px">'
        + '<div style="display:flex; align-items:flex-start; gap:12px">'
        + '<div style="width:40px; height:40px; background:var(--pu); border-radius:8px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:18px; flex-shrink:0;">&#127897;</div>'
        + '<div>'
        + '<div style="font-size:13px; font-weight:700; color:var(--bl)">Elenco SBT + N Sports (Simulcast)</div>'
        + '<div style="font-size:11px; color:var(--t2); margin-top:2px">'
        + '<strong>Narradores:</strong> Galvão Bueno (Brasil/Abertura/Final), Tiago Leifert (22 jogos).<br>'
        + '<strong>Comentaristas:</strong> Alexandre Pato, Mauro Beting, Nadine Basttos.<br>'
        + '<strong>Reportagem:</strong> Mauro Naves, André Hernan, João Venturi.'
        + '</div>'
        + '</div>'
        + '</div>'
        + '<div style="margin-top:12px; font-size:11px; color:var(--t1); background:#fff; padding:10px; border-radius:6px; border:1px solid var(--bd)">'
        + '<strong>Atra&ccedil;&atilde;o:</strong> Galvão FC (Vampeta, Beting) + Cobertura Família SBT.'
        + '</div>'
        + '</div>'
        + '<div class="phase-section-title">&#128200; An&aacute;lise de Sentimento (Mercado Publicit&aacute;rio)</div>'
        + '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">'
        + '<div style="background:#E8F5E9; border:1px solid #C8E6C9; padding:12px; border-radius:8px;">'
        + '<div style="font-size:10px; font-weight:800; color:#2E7D32; text-transform:uppercase; margin-bottom:6px">&#43; Pontos de Atracao</div>'
        + '<ul style="margin:0; padding-left:14px; font-size:10.5px; color:#1B5E20; line-height:1.4">'
        + '<li>Nostalgia e Confiança (Galvão)</li>'
        + '<li>Mix Galvão (Tradicional) + Leifert (Moderno)</li>'
        + '<li>Time GSS de bastidores (Hernan/Naves)</li>'
        + '<li>Identidade Família (DNA SBT)</li>'
        + '</ul>'
        + '</div>'
        + '<div style="background:#FFEBEE; border:1px solid #FFCDD2; padding:12px; border-radius:8px;">'
        + '<div style="font-size:10px; font-weight:800; color:#C62828; text-transform:uppercase; margin-bottom:6px">&#45; Riscos de Fuga</div>'
        + '<ul style="margin:0; padding-left:14px; font-size:10.5px; color:#B71C1C; line-height:1.4">'
        + '<li>Falta de Exclusividade (Globo)</li>'
        + '<li>Peso Digital da CazéTV (YouTube)</li>'
        + '<li>Polarização de Estilo do Galvão</li>'
        + '<li>Risco de tom excessivo de entretenimento</li>'
        + '</ul>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '<div class="detail-risk-note" style="margin-top:10px">&#9888; <strong>Janela comercial cr&iacute;tica:</strong> Negocia&ccedil;&otilde;es devem ser fechadas at&eacute; 15/05/2026. O simulcast com N Sports amplia cobertura, mas requer refor&ccedil;o no ROI vs. oferta digital da CazéTV.'
        + '</div></div></div>';
      mbd.appendChild(box);
      lucide.createIcons();

      /* Anima as barras de setor com requestAnimationFrame para garantir transição CSS */
      setTimeout(function () {
        box.querySelectorAll('.sector-bar-fill').forEach(function (b) { b.style.width = b.dataset.w; });
      }, 80);

      btn.innerHTML = origHtml;
    }

    /* =================== DETALHAR CENOGRAFIA =================== */
    async function openDetailCen(btn) {
      if (btn.dataset.open) return;
      btn.dataset.open = '1';
      var origHtml = btn.innerHTML;
      btn.innerHTML = '<div class="si sp" style="border-width:2px;width:16px;height:16px;flex-shrink:0"></div> Detalhando...';

      var mbd = createModal('Detalhamento BOM &mdash; Choque EUA x Ir&atilde;', '<span class="badge bred">SVE: R$ 39k</span>');
      document.getElementById('bds-modal').dataset.sourceBtnId = btn.id;

      var cenSteps = [
        { t: 'Analista Geopol&iacute;tico: obtendo dados de cota&ccedil;&atilde;o Brent na abertura de mercado...', s: 'Reuters' },
        { t: 'Analista de Log&iacute;stica: identificando "war surcharge" em cont&ecirc;ineres mar&iacute;timos...', s: 'Maersk / MSC' },
        { t: 'Comprador Senior: comparando cota&ccedil;&otilde;es de 3 fornecedores (A&ccedil;o/MDF)...', s: 'ERP PCP' }
      ];
      var sd = document.createElement('div'); sd.className = 'detail-mini-steps'; mbd.appendChild(sd);
      for (var s of cenSteps) {
        var el = document.createElement('div'); el.className = 'stp';
        el.innerHTML = '<div class="si sp"></div><div><span>' + s.t + '</span><div class="src-row">&#128279; Fonte: ' + s.s + '</div></div>';
        sd.appendChild(el); await dl(700);
        el.className = 'stp dn';
        el.innerHTML = '<div class="si ok">&#10003;</div><div><span>' + s.t + '</span><div class="src-row">&#128279; Fonte: ' + s.s + '</div></div>';
      }
      await dl(400);

      var BOM_DATA = [
        { item: 'A&ccedil;o tubular/chapas', base: '110k', novo: '116.6k', delta: '+6%', r: 'medio' },
        { item: 'Alum&iacute;nio perfis', base: '35k', novo: '37.8k', delta: '+8%', r: 'medio' },
        { item: 'MDF/Marcenaria', base: '65k', novo: '67.6k', delta: '+4%', r: 'baixo' },
        { item: 'Tintas/Vernizes', base: '42k', novo: '46.2k', delta: '+10%', r: 'alto' },
        { item: 'PVC/Vin&iacute;lico', base: '28k', novo: '31.3k', delta: '+12%', r: 'alto' },
        { item: 'Tecidos/Ac&uacute;stica', base: '30k', novo: '33.6k', delta: '+12%', r: 'alto' },
        { item: 'Ilumina&ccedil;&atilde;o LED', base: '72k', novo: '82.0k', delta: '+14%', r: 'alto' },
        { item: 'Cabos/El&eacute;trica', base: '18k', novo: '19.6k', delta: '+9%', r: 'medio' },
        { item: 'Consum&iacute;veis', base: '12k', novo: '12.8k', delta: '+7%', r: 'baixo' },
        { item: 'Fretes/Log&iacute;stica', base: '22k', novo: '25.3k', delta: '+15%', r: 'alto' }
      ];

      var rows = BOM_DATA.map(function (d) {
        return '<div class="phase-row" style="padding:8px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--bd)">'
          + '<div style="flex:1;font-weight:600;font-size:12px">' + d.item + '</div>'
          + '<div style="width:50px;text-align:right;font-size:11.5px;color:var(--t2)">' + d.base + '</div>'
          + '<div style="width:60px;text-align:right;font-size:12px;font-weight:700;color:var(--rd)">' + d.novo + '</div>'
          + '<div style="width:40px;text-align:right;font-size:11px;font-weight:700;color:var(--rd)">' + d.delta + '</div>'
          + '<div style="width:40px;text-align:center"><span class="risk-chip ' + d.r + '">' + d.r + '</span></div>'
          + '</div>';
      }).join('');

      var box = document.createElement('div');
      box.innerHTML = '<div class="phase-section" style="margin-top:10px">'
        + '<div class="phase-section-title">&#128230; Breakdown da BOM (Bill of Materials)</div>'
        + '<div style="display:flex;gap:10px;font-size:10px;font-weight:800;color:var(--t2);text-transform:uppercase;padding:0 14px;margin-bottom:6px">'
        + '<div style="flex:1">Insumo</div><div style="width:50px;text-align:right">Base</div><div style="width:60px;text-align:right">Novo</div><div style="width:40px;text-align:right">Delta</div><div style="width:40px;text-align:center">Risco</div></div>'
        + '<div style="max-height:300px;overflow-y:auto;border:1px solid var(--bd);border-radius:8px">' + rows + '</div>'
        + '<div style="margin-top:16px;background:#FFF4E5;border:1px solid #FFE0B2;border-radius:10px;padding:14px">'
        + '<div style="font-size:12px;font-weight:700;color:#E65100;display:flex;align-items:center;gap:6px;margin-bottom:8px"><i data-lucide="file-text" size="14"></i>Justificativa SVE para o PCP</div>'
        + '<div id="copy-sve" style="font-size:11px;color:#1a1a1a;line-height:1.4;background:#fff;padding:10px;border-radius:6px;border:1px solid #FFCC80;cursor:pointer" onclick="copySve()">'
        + 'Revis&atilde;o de or&ccedil;amento motivada por choque externo (escalada EUA x Ir&atilde;) com impacto em: (1) energia e derivados (petr&oacute;leo), pressionando frete e insumos petroqu&iacute;micos; (2) aumento de custos log&iacute;sticos por sobretaxas de risco em rotas; (3) varia&ccedil;&atilde;o de c&acirc;mbio USD/BRL afetando itens importados e componentes dolarizados. Varia&ccedil;&atilde;o consolidada: +9,0%.'
        + '</div>'
        + '<div style="font-size:10px;color:#E65100;margin-top:6px;text-align:center">Clique no quadro branco para copiar o texto</div>'
        + '</div>'
        + '</div>';

      mbd.appendChild(box);
      lucide.createIcons();
      btn.innerHTML = origHtml;
    }

    /* Função global para copiar justificativa */
    window.copySve = function () {
      var txt = document.getElementById('copy-sve').innerText;
      navigator.clipboard.writeText(txt).then(function () {
        alert('Justificativa copiada com sucesso!');
      });
    }

    /* =================== MICROFONE — ÁUDIO + TRANSCRIÇÃO ===================
     * Estratégia:
     *   1) Tenta usar SpeechRecognition real (Chrome/Edge — Web Speech API)
     *   2) Se não disponível, usa mock de transcrição após delay simulado
     *
     * Estados: isRecording (bool) | recTimer (interval id) | recSeconds (contador)
     * recognition (SpeechRecognition instance quando disponível)
     */
    var isRecording = false;
    var recTimer = null;
    var recSeconds = 0;
    var recognition = null;

    /* Transcrições simuladas usadas como fallback quando a Web Speech API não está disponível */
    var AUDIO_MOCKS = [
      'Qual o impacto financeiro se revisarmos o CPM dos breaks da final?',
      'Comparar o CPM atual da Copa com o benchmark CENP de mercado.',
      'Quais setores têm maior propensidade a fechar agora para a Copa?',
      'Simular receita com 80% dos breaks reprecificados na fase de grupos.',
      'Qual é a janela ideal para fechamento comercial dos pacotes Copa + Digital?'
    ];

    function toggleMic() {
      if (isRecording) stopRec();
      else startRec();
    }

    function startRec() {
      isRecording = true;
      recSeconds = 0;
      var btn = document.getElementById('micBtn');
      var cb = document.getElementById('cb');
      var timer = document.getElementById('micTimer');
      btn.classList.add('recording');
      btn.innerHTML = '<i data-lucide="mic-off" size="16"></i>';
      cb.classList.add('recording');
      timer.classList.add('active');
      lucide.createIcons();

      /* Atualiza o timer a cada segundo */
      recTimer = setInterval(function () {
        recSeconds++;
        var m = Math.floor(recSeconds / 60);
        var s = recSeconds % 60;
        timer.textContent = m + ':' + (s < 10 ? '0' : '') + s;
        if (recSeconds >= 30) stopRec(); /* Limita a 30 segundos */
      }, 1000);

      /* Tenta usar Web Speech API real (Chrome/Edge) */
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR) {
        recognition = new SR();
        recognition.lang = 'pt-BR';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onresult = function (e) {
          var txt = e.results[0][0].transcript;
          stopRec();
          transcribe(txt);
        };
        recognition.onerror = function () { stopRec(); transcribeMock(); };
        recognition.onend = function () { if (isRecording) stopRec(); };
        recognition.start();
      }
      /* Se não tiver API real, para automaticamente em 4s e usa mock */
      else {
        setTimeout(function () { if (isRecording) { stopRec(); transcribeMock(); } }, 4000);
      }
    }

    function stopRec() {
      if (!isRecording) return;
      isRecording = false;
      clearInterval(recTimer);
      var btn = document.getElementById('micBtn');
      var cb = document.getElementById('cb');
      var timer = document.getElementById('micTimer');
      var trans = document.getElementById('micTranscribing');
      btn.classList.remove('recording');
      btn.innerHTML = '<i data-lucide="mic" size="16"></i>';
      cb.classList.remove('recording');
      timer.classList.remove('active');
      lucide.createIcons();
      if (recognition) { try { recognition.stop(); } catch (e) { } recognition = null; }
      /* Mostra o estado "Transcrevendo..." por 1,8s antes de preencher o input */
      trans.classList.add('active');
      setTimeout(function () { trans.classList.remove('active'); }, 1800);
    }

    function transcribeMock() {
      var txt = AUDIO_MOCKS[Math.floor(Math.random() * AUDIO_MOCKS.length)];
      setTimeout(function () { transcribe(txt); }, 1800);
    }

    /* transcribe(txt) — preenche o input com o texto e envia automaticamente */
    function transcribe(txt) {
      var ci = document.getElementById('ci');
      ci.value = txt;
      ci.focus();
      /* Pequeno delay para o usuário ver o texto antes do envio */
      setTimeout(function () { hs(); }, 400);
    }

  