/**
 * navbar.js — OnzePerfeito
 * Injeta a navbar em todas as páginas autenticadas.
 * Incluir ANTES de auth.js e api.js, logo após <body>.
 *
 * Uso: <div id="navbar-placeholder"></div>
 *      <script src="navbar.js"></script>
 */

(function () {
  const HTML = `
  <nav class="navbar">
    <div class="navbar-inner">
      <a href="dashboard.html" class="navbar-logo">ONZE<span>PERFEITO</span></a>
      <ul class="navbar-links">
        <li><a href="dashboard.html">Dashboard</a></li>
        <li><a href="mercado.html">Mercado</a></li>
        <li><a href="equipa.html">A Minha Equipa</a></li>
        <li><a href="ligas.html">Ligas</a></li>
        <li><a href="classificacoes.html">Classificações</a></li>
      </ul>
      <div class="navbar-utilizador">
        <span class="navbar-nome" id="navbar-nome"></span>
        <button class="btn btn-secundario btn-sm" onclick="Auth.terminarSessao()">Sair</button>
      </div>
      <div class="navbar-mobile-toggle" onclick="toggleMenuMobile()">
        <span></span><span></span><span></span>
      </div>
    </div>
    <!-- Menu mobile -->
    <div id="navbar-mobile" style="display:none; padding: 1rem 1.5rem; border-top: 1px solid rgba(201,168,76,0.15);">
      <ul style="list-style:none; display:flex; flex-direction:column; gap:0.25rem;">
        <li><a href="dashboard.html" style="display:block; padding:0.5rem 0; color:rgba(245,245,240,0.8); font-size:0.9rem;">Dashboard</a></li>
        <li><a href="mercado.html" style="display:block; padding:0.5rem 0; color:rgba(245,245,240,0.8); font-size:0.9rem;">Mercado</a></li>
        <li><a href="equipa.html" style="display:block; padding:0.5rem 0; color:rgba(245,245,240,0.8); font-size:0.9rem;">A Minha Equipa</a></li>
        <li><a href="ligas.html" style="display:block; padding:0.5rem 0; color:rgba(245,245,240,0.8); font-size:0.9rem;">Ligas</a></li>
        <li><a href="classificacoes.html" style="display:block; padding:0.5rem 0; color:rgba(245,245,240,0.8); font-size:0.9rem;">Classificações</a></li>
      </ul>
      <button class="btn btn-secundario btn-sm mt-2" onclick="Auth.terminarSessao()">Sair</button>
    </div>
  </nav>`;

  const placeholder = document.getElementById('navbar-placeholder');
  if (placeholder) placeholder.outerHTML = HTML;

  function toggleMenuMobile() {
    const menu = document.getElementById('navbar-mobile');
    if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  }
  window.toggleMenuMobile = toggleMenuMobile;
})();
