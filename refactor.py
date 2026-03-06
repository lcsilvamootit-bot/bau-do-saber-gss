import re
import sys

def main():
    filepath = r'C:\Users\crist\Desktop\Hackaton\bau-do-saber-gss\index.html'
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update Sidebar Menu (Line ~1682)
    content = content.replace(
        '<div class="mi"><i data-lucide="tv" size="16"></i>Grade SBT &mdash; Ibope/Kantar</div>',
        '<div class="mi"><i data-lucide="shield-check" size="16"></i>Aprova&ccedil;&atilde;o Governada &mdash; Painel LED</div>'
    )
    
    # 2. Update Sidebar Alerts (Line ~1686)
    content = content.replace(
        '<div class="mi"><span class="dot dy"></span>Grade Prime Time &ndash; Rating Queda</div>',
        '<div class="mi"><span class="dot dy"></span>Aprova&ccedil;&atilde;o Governada &ndash; Exce&ccedil;&atilde;o de Pol&iacute;tica</div>'
    )
    
    # 3. Update Home Screen Card (.sc) (Line ~1741)
    old_grade_card = """          <div class="sc" onclick="go('grade')">
            <div class="sl2">&#128250; Grade SBT &mdash; Rating</div>
            <div class="st">Otimizar grade de programa&ccedil;&atilde;o usando dados Ibope/Kantar para recuperar prime
              time</div>
            <div class="sm2">&#128250; Prime time SBT: 6,5 pts m&eacute;dia vs 25 pts da concorr&ecirc;ncia</div>
            <div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:2px">
              <span class="src-tag external">Ibope/Kantar</span>
              <span class="src-tag internal">EPG</span>
              <span class="src-tag external">Globoplay</span>
            </div>
          </div>"""
    
    new_gov_card = """          <div class="sc" onclick="go('gov')">
            <div class="sl2"><i data-lucide="shield-alert" size="14"></i> Aprova&ccedil;&atilde;o Governada</div>
            <div class="st">Emitir parecer executivo com base em dados internos restritos para Painel LED e Licen&ccedil;a</div>
            <div class="sm2">&#128308; Opera&ccedil;&atilde;o cr&iacute;tica &mdash; Depend&ecirc;ncia contratual</div>
            <div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:2px">
              <span class="src-tag internal">ERP Financeiro</span>
              <span class="src-tag internal">Compliance</span>
              <span class="src-tag internal">Invent&aacute;rio</span>
            </div>
          </div>"""
    content = content.replace(old_grade_card, new_gov_card)

    # 4. Update LABELS (Line ~1954)
    content = content.replace(
        "grade: 'Avaliar a grade de programação do SBT e recuperar audiência no prime time',",
        "gov: 'Considerando or&ccedil;amento, pol&iacute;ticas internas e criticidade operacional, devemos aprovar a compra do painel de LED com licen&ccedil;a de software?',"
    )

    # 5. Update FLOWS (Line ~2023)
    old_grade_flow = """      grade: [
        { t: 'Agente Ibope/Kantar: carregando m&eacute;dias de rating SBT por faixa hor&aacute;ria (Dez/Jan)...', s: 'Ibope/Kantar' },
        { t: 'Agente EPG: lendo grade atual e identificando programas com queda &gt;2 pontos...', s: 'EPG Interno' },
        { t: 'Agente Concorr&ecirc;ncia: analisando audi&ecirc;ncia Globo, Record e Band para o mesmo slot...', s: 'Kantar Media' },
        { t: 'Agente Cont&eacute;udo: verificando cat&aacute;logo de programas do +SBT adapt&aacute;veis &agrave; grade...', s: 'Cat&aacute;logo +SBT' },
        { t: 'Agente S&iacute;ntese: propondo realoca&ccedil;&atilde;o de grade com impacto financeiro estimado...', s: 'Modelo GSS' }
      ],"""
    new_gov_flow = """      gov: [
        { t: 'Agente ERP Financ.: lendo saldo or&ccedil;ament&aacute;rio, centro de custo e al&ccedil;ada...', s: 'ERP Financeiro e Al&ccedil;adas' },
        { t: 'Agente Estat&iacute;stico: comparando com hist&oacute;rico e varia&ccedil;&atilde;o padr&atilde;o interna...', s: 'Hist&oacute;rico Estat&iacute;stico Interno' },
        { t: 'Agente Operacional: validando criticidade e depend&ecirc;ncia de licen&ccedil;a...', s: 'Opera&ccedil;&atilde;o e Invent&aacute;rio' },
        { t: 'Agente Pol&iacute;ticas: conferindo ader&ecirc;ncia a exce&ccedil;&otilde;es e compliance...', s: 'Pol&iacute;ticas Internas' },
        { t: 'Agente Impacto: projetando custo, continuidade e exposi&ccedil;&atilde;o contratual...', s: 'Modelo GSS de Impacto' },
        { t: 'Agente Supervisor: consolidando recomenda&ccedil;&atilde;o com justificativa rastre&aacute;vel...', s: 'Camada Executiva' }
      ],"""
    content = content.replace(old_grade_flow, new_gov_flow)
    
    # 6. Update `flow()` dispatch logic (Line ~2072)
    content = content.replace("else if (mode === 'grade') gradecrd(b);", "else if (mode === 'gov') govcrd(b);")

    # 7. Update MEMBERS (Line ~2358)
    content = content.replace(
        "grade: [{ i: 'FM', n: 'Felipe Menezes', r: 'Diretor de Programa&ccedil;&atilde;o', c: '#002855' }, { i: 'SR', n: 'Sandra Rocha', r: 'Ger. de Conte&uacute;do', c: '#5B5FC7' }, { i: 'BC', n: 'Bruno Carvalho', r: 'Analista Ibope/Kantar', c: '#008751' }, { i: 'PF', n: 'Patricia Fonseca', r: 'Diretora de M&iacute;dia', c: '#D32F2F' }],",
        "gov: [{ i: 'DF', n: 'Diretor Financeiro', r: 'Financeiro', c: '#1D4ED8' }, { i: 'CP', n: 'Compliance e Pol&iacute;ticas', r: 'Governan&ccedil;a', c: '#7C3AED' }, { i: 'OP', n: 'Gest&atilde;o de Opera&ccedil;&atilde;o', r: 'Opera&ccedil;&atilde;o T&eacute;cnica', c: '#059669' }],"
    )

    # 8. Update AGENDAS and MEETINGS (Line ~2364)
    content = content.replace(
        "grade: 'Aprova&ccedil;&atilde;o de realoca&ccedil;&atilde;o da grade prime time + defini&ccedil;&atilde;o de formato para 21h + metas de rating.',",
        "gov: 'Valida&ccedil;&atilde;o executiva da compra do painel LED, ader&ecirc;ncia &agrave;s pol&iacute;ticas, impacto e prote&ccedil;&atilde;o contratual.',"
    )
    content = content.replace("grade: 'grade-sbt'", "gov: 'comite-aprovacao-governada'")

    # 9. Update openSilvio mode fallback (Line ~2260)
    content = content.replace("m === 'cenografia' ? 'voz_Silvio_1.mp3' : 'voz_Silvio_3.mp3'", "m === 'cenografia' ? 'voz_Silvio_1.mp3' : 'voz_Silvio_3.mp3'")
    content = content.replace("m === 'grade'", "m === 'gov'")
    
    # Update content in openSilvio
    old_silvio_grade = """        grade: {
          slogan: "A pergunta é: como vamos transformar essa audiência em faturamento?",
          text: "Ter um programa que não se paga é um sonho, mas a gente vive de realidade. Precisamos encontrar uma equação que traga esses 22 milhões. Se o público mudou, a gente muda a grade. Sinceramente, o que importa é o resultado no final do dia.",
          verdict: "Realocar ativos da grade para faixas de maior retorno."
        },"""
    new_silvio_gov = """        gov: {
          slogan: "Não é um chat. É inteligência governada sobre dados internos críticos.",
          text: "Em um cenário de aprovação de verba, a solução não apenas responde perguntas. Ela investiga o contexto com base em dados internos proprietários, políticas corporativas e sinais operacionais reais. Um agente financeiro avalia orçamento, alçada e impacto econômico. Um agente estatístico compara a solicitação com padrões históricos. Um agente de políticas verifica aderência às regras internas. Um agente de análise de impacto mede os efeitos da decisão sobre operação. A entrega final é explicável e rastreável.",
          verdict: "Aprovar com condicionantes formais de política e proteção contratual da licença."
        },"""
    content = content.replace(old_silvio_grade, new_silvio_gov)

    # 10. Replace gradecrd function entirely + Add Sim and Detail Gov (~2136-2162)
    # the function is called gradecrd
    # I'll use regex to replace from `/* =================== CASE 3: GRADE =================== */` to `/* =================== CASE 4: JEQUITI =================== */`
    
    replacement_cards = """    /* =================== CASE 3: GOVERNANÇA =================== */
    function govcrd(b) {
      var el = document.createElement('div');
      el.className = 'ec';
      el.innerHTML = `<div class="ech">
        <h3><i data-lucide="shield-check" size="15"></i>Parecer Executivo &mdash; Aprova&ccedil;&atilde;o Governada</h3>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="badge" style="background:#FFF3CD;color:#856404;border:1px solid #FFEEDB">Prioridade Alta</span>
        </div>
      </div><div class="ecb">
<p class="bt2"><strong>Diagn&oacute;stico:</strong> A an&aacute;lise dos dados internos propriet&aacute;rios indica que a solicita&ccedil;&atilde;o atende a necessidade operacional, por&eacute;m exige controle adicional por envolver valor acima da m&eacute;dia hist&oacute;rica, depend&ecirc;ncia recorrente de licen&ccedil;a e ader&ecirc;ncia formal &agrave;s pol&iacute;ticas internas de contrata&ccedil;&atilde;o.</p>
<div class="kg">
<div class="kb"><div class="kl">Ader&ecirc;ncia &agrave; Pol&iacute;tica</div><div class="kv b">82%</div><div class="ks">Exige valida&ccedil;&atilde;o formal</div></div>
<div class="kb"><div class="kl">Desvio vs Hist&oacute;rico</div><div class="kv y">+18%</div><div class="ks">Acima da m&eacute;dia interna</div></div>
<div class="kb"><div class="kl">Impacto Operacional</div><div class="kv r">Alto</div><div class="ks">Se não aprovado (Indisponibilidade)</div></div>
</div>
<div class="sdv">Recomenda&ccedil;&atilde;o</div>
<p class="bt2">&#10003; <strong>Aprovar compra</strong> com condicionante de conformidade &agrave;s pol&iacute;ticas internas e valida&ccedil;&atilde;o da exce&ccedil;&atilde;o de valor.<br>&#10003; <strong>Negociar cl&aacute;usulas</strong> de continuidade operacional, SLA, garantia estendida e previsibilidade de renova&ccedil;&atilde;o da licen&ccedil;a.<br>&#10003; <strong>Formalizar reserva</strong> or&ccedil;ament&aacute;ria para o Custo Total de Propriedade (TCO) e depend&ecirc;ncia tecnol&oacute;gica futura.</p>
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

      mbd.innerHTML = '<div class="sim-c"><h4><i data-lucide="calculator" size="14"></i> Sensibilidade de Operação vs. Custo</h4><label style="font-size:12.5px;font-weight:700;display:flex;justify-content:space-between;margin-bottom:6px">N&iacute;vel de utiliza&ccedil;&atilde;o operacional prevista <span id="' + uid + '_sv">75</span>%</label><input type="range" min="0" max="100" value="75" style="width:100%;accent-color:var(--pu);margin-bottom:12px" oninput="updSGov(this.value,\\'' + uid + '\\')"><div class="sr"><div class="sl3">&Iacute;ndice Composto de Impacto vs Retorno</div><div class="sv" id="' + uid + '_sv2" style="transition:color 0.3s ease;color:#008060">Boa Aderência</div><div style="font-size:11px;color:var(--t2);margin-top:3px">Fórmula: (utilização * peso) - (custo_total + risco_contratual)</div></div><div id="' + uid + '_summary" style="margin-top:14px;font-size:11.5px;color:var(--t2);padding:10px;background:#F8F9FA;border-radius:8px;border:1px solid var(--bd);line-height:1.4"><strong style="color:#008060">Investimento aderente:</strong> Consistente com a necessidade do neg&oacute;cio.</div></div>';
      lucide.createIcons();
    }
    
    window.updSGov = function(v, uid) {
      var sv = document.getElementById(uid + '_sv');
      var sv2 = document.getElementById(uid + '_sv2');
      var sum = document.getElementById(uid + '_summary');

      sv.textContent = v;

      if (v <= 30) {
        sv2.textContent = 'Destrói Valor';
        sv2.style.color = '#D62828';
        sum.innerHTML = '<strong style="color:#D62828">Baixa Ader&ecirc;ncia:</strong> Aprova&ccedil;&atilde;o destruir&aacute; valor. Custo total e taxa de ociosidade anulam o retorno.';
      } else if (v <= 65) {
        sv2.textContent = 'Risco Moderado';
        sv2.style.color = '#D97706';
        sum.innerHTML = '<strong style="color:#D97706">Impacto Moderado:</strong> Aprova&ccedil;&atilde;o depende da mitiga&ccedil;&atilde;o de riscos de infraestrutura legada.';
      } else {
        sv2.textContent = 'Boa Aderência';
        sv2.style.color = '#008060';
        sum.innerHTML = '<strong style="color:#008060">Investimento Consistente:</strong> Adequado &agrave; alta necessidade e &agrave;s poli&iacute;ticas de compras.';
      }
    }

    /* =================== DETALHAR GOVERNANÇA =================== */
    window.openDetailGov = async function(btn) {
      if (btn.dataset.open) return;
      btn.dataset.open = '1';
      var origHtml = btn.innerHTML;
      btn.innerHTML = '<div class="si sp" style="border-width:2px;width:16px;height:16px;flex-shrink:0"></div> Analisando...';

      var mbd = createModal('An&aacute;lise Cruzada c/ Dados Internos Restritos', '<span class="badge" style="background:#E8F5E9;color:#137333">Auditoria Executiva</span>');
      document.getElementById('bds-modal').dataset.sourceBtnId = btn.id;

      var govSteps = [
        { t: 'Agente de Al&ccedil;adas verificando limite or&ccedil;ament&aacute;rio...', s: 'ERP SAP' },
        { t: 'Agente de Compliance validando depend&ecirc;ncia de licen&ccedil;a (vendor lock-in)...', s: 'Master de Contratos' },
        { t: 'Motor de Risco processando indicadores de anomalia...', s: 'Data Lake Governamental' }
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
        { c1: 'Orçamento e Alçada', c2: 'Saldo com comprometimento', c3: 'Vi&aacute;vel c/ Condicionante', ref: 'Aprova&ccedil;&atilde;o por faixa', d: '+7.8%', r: 'medio', x:'Cabe no orçamento mas ultrapassa média histórica, exigindo aprovação extra.' },
        { c1: 'Aderência a Política', c2: 'Exceção e Compliance', c3: 'Parcialmente Aderente', ref: 'Política Corporativa de Compras', d: '-18%', r: 'medio', x:'Exceção permitida via justificação técnica, sem as 3 cotações habituais.' },
        { c1: 'Impacto Operacional', c2: 'Criticidade & Continuidade', c3: 'Uso Altamente Relevante', ref: 'Indicadores C-Level', d: '+32%', r: 'alto', x:'O não andamento implica risco severo na entrega dos estúdios.' }
      ];

      var rows = GOV_DATA.map(function(d) {
        return '<div class="phase-row" style="padding:10px 14px;border-bottom:1px solid var(--bd);flex-wrap:wrap;align-items:flex-start">'
          + '<div style="display:flex;width:100%;gap:10px">'
          + '<div style="width:140px;font-weight:700;font-size:12.5px;color:var(--bl)">' + d.c1 + '</div>'
          + '<div style="flex:1;font-size:11px;color:var(--t1)"><span style="color:var(--t2)">Sinal Avaliado:</span> ' + d.c2 + '<br><strong style="color:var(--pu)"><i data-lucide="check-circle" size="10"></i> ' + d.c3 + '</strong><br><span style="color:#777;font-size:10px">Ref: ' + d.ref + '</span></div>'
          + '<div style="width:50px;text-align:right;font-size:12px;font-weight:700;color:var(--rd)">' + d.d + '</div>'
          + '<div style="width:60px;text-align:center"><span class="risk-chip ' + d.r + '" style="margin-top:2px">' + d.r + '</span></div>'
          + '</div>'
          + '<div style="width:100%;margin-top:8px;padding-top:8px;border-top:1px dashed var(--bd);color:#5E5E5E;font-size:11px;line-height:1.4"><i data-lucide="alert-triangle" size="10" style="margin-right:4px;color:var(--ye)"></i>' + d.x + '</div>'
          + '</div>';
      }).join('');

      var box = document.createElement('div');
      box.innerHTML = '<div class="phase-section" style="margin-top:10px">'
        + '<div style="background:#F4F4F4; border-left:3px solid var(--pu); padding:12px 14px; border-radius:6px; margin-bottom:16px; font-size:11.5px; color:#333; line-height:1.5;"><strong>Nota de Conformidade:</strong> A orquestração dos dados protege contra alucinações generativas, balizando as decisões somente sobre "Data Lakes" auditados.</div>'
        + '<div style="display:flex;gap:10px;font-size:10px;font-weight:800;color:var(--t2);text-transform:uppercase;padding:0 14px;margin-bottom:6px">'
        + '<div style="width:140px">Dimensão</div><div style="flex:1">Sinal Interno & Avaliação</div><div style="width:50px;text-align:right">Delta</div><div style="width:60px;text-align:center">Risco</div></div>'
        + '<div style="max-height:360px;overflow-y:auto;border:1px solid var(--bd);border-radius:12px">' + rows + '</div>'
        + '</div>';

      mbd.appendChild(box);
      lucide.createIcons();
      btn.innerHTML = origHtml;
    }

    /* =================== CASE 4: JEQUITI =================== */"""

    content = re.sub(
        r'/\* =================== CASE 3: GRADE =================== \*/.*?/\* =================== CASE 4: JEQUITI =================== \*/',
        replacement_cards,
        content,
        flags=re.DOTALL
    )

    # 11. Update xcrd (Line wait, it's after JEQUITI)
    content = content.replace(
        '<button class="btn bo" onclick="go(\\\'grade\\\')">&#128250; Grade SBT</button>',
        '<button class="btn bo" onclick="go(\\\'gov\\\')"><i data-lucide="shield-check" size="14" style="color:var(--pu)"></i> Aprova&ccedil;&atilde;o Gov.</button>'
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print("Substitutions applied successfully.")

if __name__ == '__main__':
    main()
