/**
 * avatares.js — OnzePerfeito
 * Gestão de imagens:
 *   - Logos dos clubes → Azure BLOB Storage (upload manual)
 *   - Fotos dos jogadores → Wikipedia API com fallback para avatar com iniciais
 */

const Avatares = (() => {

  // ── Configuração BLOB Storage ──────────────────────────────────
  const BLOB_BASE = 'https://onzeperfeitostorage.blob.core.windows.net/imagens';

  // Mapeamento clube → nome do ficheiro no BLOB Storage
  const LOGOS_CLUBES = {
    'Sporting CP':              'sporting.png',
    'FC Porto':                 'porto.png',
    'SL Benfica':               'benfica.png',
    'SC Braga':                 'braga.png',
    'FC Alverca':               'alverca.png',
    'Gil Vicente FC':           'gil-vicente.png',
    'GD Estoril Praia':         'estoril.png',
    'CD Santa Clara':           'santa-clara.png',
    'CD Nacional':              'nacional.png',
    'Vitória SC':               'vitoria-sc.png',
    'FC Famalicão':             'famalicao.png',
    'CF Estrela da Amadora':    'estrela-amadora.png',
    'FC Arouca':                'arouca.png',
    'Casa Pia AC':              'casa-pia.png',
    'CD Tondela':               'tondela.png',
    'AVS Futebol SAD':          'avs.png',
    'Moreirense FC':            'moreirense.png',
    'Rio Ave FC':               'rio-ave.png',
  };

  // Cores associadas a cada clube (para avatares de jogadores)
  const CORES_CLUBES = {
    'Sporting CP':           '#006f3c',
    'FC Porto':              '#003f8a',
    'SL Benfica':            '#cc0000',
    'SC Braga':              '#cc0000',
    'FC Alverca':            '#e8c84c',
    'Gil Vicente FC':        '#000000',
    'GD Estoril Praia':      '#f5d000',
    'CD Santa Clara':        '#cc0000',
    'CD Nacional':           '#000033',
    'Vitória SC':            '#000000',
    'FC Famalicão':          '#003f8a',
    'CF Estrela da Amadora': '#cc0000',
    'FC Arouca':             '#1a5c35',
    'Casa Pia AC':           '#000080',
    'CD Tondela':            '#228b22',
    'AVS Futebol SAD':       '#cc6600',
    'Moreirense FC':         '#006400',
    'Rio Ave FC':            '#006400',
  };

  // Cache de fotos de jogadores já carregadas (evita pedidos repetidos)
  const cacheWikipedia = new Map();

  // ── Logo do clube ──────────────────────────────────────────────

  /**
   * Retorna o URL do logo do clube no BLOB Storage.
   * @param {string} clube - Nome do clube
   * @returns {string} URL do logo
   */
  function urlLogo(clube) {
    const ficheiro = LOGOS_CLUBES[clube];
    if (!ficheiro) return null;
    return `${BLOB_BASE}/${ficheiro}`;
  }

  /**
   * Cria um elemento <img> com o logo do clube.
   * Se o logo falhar (404, erro de rede), mostra as iniciais do clube.
   * @param {string} clube
   * @param {number} tamanho - Tamanho em px (default: 32)
   * @returns {HTMLElement}
   */
  function criarLogoClube(clube, tamanho = 32) {
    const url = urlLogo(clube);
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      width: ${tamanho}px; height: ${tamanho}px;
      display: inline-flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    `;

    if (url) {
      const img = document.createElement('img');
      img.src = url;
      img.alt = clube;
      img.style.cssText = `width: ${tamanho}px; height: ${tamanho}px; object-fit: contain;`;
      img.onerror = () => {
        // Fallback: iniciais do clube
        wrapper.removeChild(img);
        wrapper.appendChild(_inicialClube(clube, tamanho));
      };
      wrapper.appendChild(img);
    } else {
      wrapper.appendChild(_inicialClube(clube, tamanho));
    }

    return wrapper;
  }

  function _inicialClube(clube, tamanho) {
    const span = document.createElement('span');
    const iniciais = clube.split(' ')
      .filter(p => p.length > 2)
      .slice(0, 2)
      .map(p => p[0])
      .join('');
    span.textContent = iniciais || clube[0];
    span.style.cssText = `
      width: ${tamanho}px; height: ${tamanho}px;
      display: inline-flex; align-items: center; justify-content: center;
      background: ${CORES_CLUBES[clube] || '#1a5c35'};
      color: white;
      font-family: 'DM Sans', sans-serif;
      font-size: ${Math.floor(tamanho * 0.38)}px;
      font-weight: 700;
      border-radius: 4px;
      letter-spacing: 0.02em;
    `;
    return span;
  }

  // ── Avatar do jogador ──────────────────────────────────────────

  /**
   * Tenta carregar a foto do jogador da Wikipedia.
   * Devolve URL da imagem ou null se não encontrar.
   * @param {string} nome - Nome completo do jogador
   * @returns {Promise<string|null>}
   */
  async function buscarFotoWikipedia(nome) {
    if (cacheWikipedia.has(nome)) return cacheWikipedia.get(nome);

    try {
      // API da Wikipedia: buscar thumbnail da página do jogador
      const query = encodeURIComponent(nome);
      const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${query}&prop=pageimages&format=json&pithumbsize=100&origin=*`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!resp.ok) throw new Error();

      const data = await resp.json();
      const pages = data.query?.pages || {};
      const page = Object.values(pages)[0];
      const fotoUrl = page?.thumbnail?.source || null;

      cacheWikipedia.set(nome, fotoUrl);
      return fotoUrl;
    } catch {
      cacheWikipedia.set(nome, null);
      return null;
    }
  }

  /**
   * Cria um avatar circular para o jogador.
   * Tenta Wikipedia; fallback para iniciais com cor do clube.
   * @param {Object} jogador - { nome, clube }
   * @param {number} tamanho - Tamanho em px (default: 40)
   * @returns {HTMLElement}
   */
  function criarAvatarJogador(jogador, tamanho = 40) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      width: ${tamanho}px; height: ${tamanho}px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
      display: inline-flex; align-items: center; justify-content: center;
      border: 2px solid rgba(201,168,76,0.25);
    `;

    // Mostrar avatar com iniciais imediatamente
    wrapper.appendChild(_avatarIniciais(jogador, tamanho));

    // Tentar carregar foto da Wikipedia em background
    buscarFotoWikipedia(jogador.nome).then(fotoUrl => {
      if (fotoUrl) {
        const img = document.createElement('img');
        img.src = fotoUrl;
        img.alt = jogador.nome;
        img.style.cssText = `width: 100%; height: 100%; object-fit: cover;`;
        img.onload = () => {
          wrapper.innerHTML = '';
          wrapper.appendChild(img);
        };
        img.onerror = () => { /* manter iniciais */ };
      }
    });

    return wrapper;
  }

  function _avatarIniciais(jogador, tamanho) {
    const span = document.createElement('span');
    const partes = jogador.nome.trim().split(' ');
    const iniciais = partes.length >= 2
      ? partes[0][0] + partes[partes.length - 1][0]
      : partes[0].slice(0, 2);
    span.textContent = iniciais.toUpperCase();
    span.style.cssText = `
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      background: ${CORES_CLUBES[jogador.clube] || '#1a5c35'};
      color: white;
      font-family: 'DM Sans', sans-serif;
      font-size: ${Math.floor(tamanho * 0.36)}px;
      font-weight: 700;
      letter-spacing: 0.02em;
    `;
    return span;
  }

  // ── HTML helpers (para usar em innerHTML) ─────────────────────

  /**
   * Retorna HTML de img para o logo do clube (para usar em tabelas).
   * Usar criarLogoClube() sempre que possível (suporta fallback).
   */
  function htmlLogo(clube, tamanho = 28) {
    const url = urlLogo(clube);
    if (!url) return `<span style="font-size:${tamanho * 0.5}px">⚽</span>`;
    return `<img src="${url}" alt="${clube}"
              style="width:${tamanho}px;height:${tamanho}px;object-fit:contain;vertical-align:middle;"
              onerror="this.style.display='none'">`;
  }

  return {
    urlLogo,
    criarLogoClube,
    criarAvatarJogador,
    buscarFotoWikipedia,
    htmlLogo,
    CORES_CLUBES,
    LOGOS_CLUBES,
  };
})();