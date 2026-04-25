/**
 * api.js — OnzePerfeito
 * Wrapper centralizado para todas as chamadas ao backend Flask.
 * Injeta automaticamente o token JWT em cada pedido autenticado.
 *
 * URL base: configurar consoante o ambiente.
 */

const API_BASE = 'https://onzeperfeito-app-dravg3ajcacbftdh.francecentral-01.azurewebsites.net';

const API = (() => {

  // ── Método base de fetch ─────────────────────────────────
  async function pedido(metodo, rota, corpo = null, autenticado = true) {
    const headers = { 'Content-Type': 'application/json' };

    if (autenticado) {
      const token = Auth.obterToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const opcoes = { method: metodo, headers };
    if (corpo) opcoes.body = JSON.stringify(corpo);

    const resposta = await fetch(`${API_BASE}${rota}`, opcoes);

    // Se 401, sessão expirou
    if (resposta.status === 401) {
      Auth.terminarSessao();
      return null;
    }

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || `Erro ${resposta.status}`);
    }

    return dados;
  }

  // ── Auth ─────────────────────────────────────────────────
  const auth = {
    registar: (nome, email, password) =>
      pedido('POST', '/auth/register', { nome, email, password }, false),

    login: (email, password) =>
      pedido('POST', '/auth/login', { email, password }, false),
  };

  // ── Jogadores ────────────────────────────────────────────
  const jogadores = {
    listar: (clube = null) => {
      const qs = clube ? `?clube=${encodeURIComponent(clube)}` : '';
      return pedido('GET', `/jogadores/${qs}`);
    },

    obter: (id) =>
      pedido('GET', `/jogadores/${id}`),
  };

  // ── Equipas ──────────────────────────────────────────────
  const equipas = {
    obter: (utilizadorId) =>
      pedido('GET', `/equipas/?utilizador_id=${utilizadorId}`),

    guardar: (utilizadorId, listaJogadores) =>
      pedido('POST', '/equipas/', {
        utilizador_id: utilizadorId,
        jogadores: listaJogadores,
      }),
  };

  // ── Ligas ────────────────────────────────────────────────
  const ligas = {
    listar: (tipo = 'global') =>
      pedido('GET', `/ligas/?tipo=${tipo}`),

    listarPrivadas: () =>
      pedido('GET', '/ligas/?tipo=privada'),

    criar: (nome, criadorId) =>
      pedido('POST', '/ligas/criar', { nome, criador_id: criadorId }),

    entrar: (codigo, utilizadorId) =>
      pedido('POST', '/ligas/entrar', { codigo, utilizador_id: utilizadorId }),
  };

  // ── Jornadas ─────────────────────────────────────────────
  const jornadas = {
    pontuacoes: (jornada = null) => {
      const qs = jornada ? `?jornada=${jornada}` : '';
      return pedido('GET', `/jornadas/pontuacoes${qs}`);
    },

    evento: (jornada) =>
      pedido('GET', `/jornadas/evento?jornada=${jornada}`),
  };

  // ── Utilitários UI ───────────────────────────────────────

  /** Mostra mensagem de erro ou sucesso num elemento .alerta */
  function mostrarAlerta(idElemento, mensagem, tipo = 'erro') {
    const el = document.getElementById(idElemento);
    if (!el) return;
    el.textContent = mensagem;
    el.className = `alerta alerta-${tipo} visivel`;
    setTimeout(() => el.classList.remove('visivel'), 5000);
  }

  /** Ativa/desativa botão com spinner durante pedido assíncrono */
  function setBotaoCarregando(btn, carregando, textoOriginal) {
    if (carregando) {
      btn.disabled = true;
      btn.dataset.textoOriginal = btn.textContent;
      btn.innerHTML = '<span class="spinner"></span>';
    } else {
      btn.disabled = false;
      btn.textContent = textoOriginal || btn.dataset.textoOriginal || 'OK';
    }
  }

  /** Retorna badge HTML para posição */
  function badgePosicao(posicao) {
    const mapa = {
      'guarda-redes': ['GR',  'badge-gr'],
      'defesa':       ['DEF', 'badge-def'],
      'medio':        ['MED', 'badge-med'],
      'avancado':     ['AV',  'badge-av'],
    };
    const [abrev, classe] = mapa[posicao] || ['?', 'badge-gr'];
    return `<span class="badge-posicao ${classe}">${abrev}</span>`;
  }

  /** Formata preço */
  function formatarPreco(valor) {
    return `${Number(valor).toFixed(1)}M€`;
  }

  /** Formata média de pontuações */
  function formatarMedia(valor) {
    return Number(valor).toFixed(1);
  }

  return {
    auth,
    jogadores,
    equipas,
    ligas,
    jornadas,
    mostrarAlerta,
    setBotaoCarregando,
    badgePosicao,
    formatarPreco,
    formatarMedia,
  };
})();
