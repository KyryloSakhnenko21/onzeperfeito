/**
 * auth.js — OnzePerfeito
 * Gestão de sessão JWT no lado do cliente.
 * Todas as páginas incluem este ficheiro.
 */

const Auth = (() => {
  const CHAVE_TOKEN = 'op_token';
  const CHAVE_NOME  = 'op_nome';
  const CHAVE_ID    = 'op_id';

  // ── Guardar sessão após login ────────────────────────────
  function guardarSessao(token, nome, id) {
    localStorage.setItem(CHAVE_TOKEN, token);
    localStorage.setItem(CHAVE_NOME,  nome);
    localStorage.setItem(CHAVE_ID,    id);
  }

  // ── Limpar sessão (logout) ───────────────────────────────
  function terminarSessao() {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_NOME);
    localStorage.removeItem(CHAVE_ID);
    window.location.href = 'index.html';
  }

  // ── Obter token ──────────────────────────────────────────
  function obterToken() {
    return localStorage.getItem(CHAVE_TOKEN);
  }

  // ── Obter nome do utilizador ─────────────────────────────
  function obterNome() {
    return localStorage.getItem(CHAVE_NOME) || '';
  }

  // ── Obter ID do utilizador ───────────────────────────────
  function obterID() {
    return localStorage.getItem(CHAVE_ID) || '';
  }

  // ── Verificar se está autenticado ────────────────────────
  function estaAutenticado() {
    const token = obterToken();
    if (!token) return false;

    // Verificar se o token JWT ainda não expirou (decode simples do payload)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const agora = Math.floor(Date.now() / 1000);
      return payload.exp > agora;
    } catch {
      return false;
    }
  }

  // ── Obter ID a partir do payload JWT ────────────────────
  function obterIDdoToken() {
    const token = obterToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || null;
    } catch {
      return null;
    }
  }

  // ── Proteger página: redireciona se não autenticado ──────
  function exigirAutenticacao() {
    if (!estaAutenticado()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }

  // ── Redirecionar se já autenticado (para página de login) ─
  function redireccionarSeAutenticado() {
    if (estaAutenticado()) {
      window.location.href = 'dashboard.html';
    }
  }

  // ── Preencher nome do utilizador na navbar ────────────────
  function preencherNavbar() {
    const el = document.getElementById('navbar-nome');
    if (el) el.textContent = obterNome();

    // Marcar link ativo consoante a página atual
    const pagina = window.location.pathname.split('/').pop();
    document.querySelectorAll('.navbar-links a').forEach(link => {
      if (link.getAttribute('href') === pagina) {
        link.classList.add('ativo');
      }
    });
  }

  return {
    guardarSessao,
    terminarSessao,
    obterToken,
    obterNome,
    obterID,
    estaAutenticado,
    obterIDdoToken,
    exigirAutenticacao,
    redireccionarSeAutenticado,
    preencherNavbar,
  };
})();
