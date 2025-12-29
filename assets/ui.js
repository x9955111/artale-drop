
(function(){
  function applyTheme(theme){
    const dark = theme === 'dark';
    document.documentElement.classList.toggle('dark', dark);
    document.body.classList.toggle('dark', dark);
  }
  function getSavedTheme(){
    const t = localStorage.getItem('theme');
    if(t === 'dark' || t === 'light') return t;
    // default: follow system
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  window.__setTheme = function(theme){
    localStorage.setItem('theme', theme);
    applyTheme(theme);
  };

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getSavedTheme());

    // active nav
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('[data-nav]').forEach(a=>{
      const href = (a.getAttribute('href') || '').toLowerCase();
      const target = href.split('/').pop();
      if(target === path) a.classList.add('active');
      // also handle root route
      if((path === '' || path === 'index.html') && (target === 'index.html' || target === '')) a.classList.add('active');
    });

    // theme toggle
    const btn = document.getElementById('themeToggle');
    if(btn){
      btn.addEventListener('click', ()=>{
        const isDark = document.documentElement.classList.contains('dark');
        window.__setTheme(isDark ? 'light' : 'dark');
      });
    }

    // mobile drawer
    const openBtn = document.getElementById('menuBtn');
    const drawer = document.getElementById('mobileDrawer');
    const close = () => drawer && drawer.classList.remove('open');
    const open = () => drawer && drawer.classList.add('open');
    if(openBtn && drawer){
      openBtn.addEventListener('click', open);
      drawer.addEventListener('click', (e)=>{
        if(e.target && (e.target.classList.contains('drawer-backdrop'))) close();
      });
      drawer.querySelectorAll('a').forEach(a=>a.addEventListener('click', close));
      document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') close(); });
    }
  });
})();
