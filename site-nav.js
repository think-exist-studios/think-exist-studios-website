(()=>{
  const VERA_PUBLIC=false;
  if(!VERA_PUBLIC){
    document.querySelectorAll('.nav a[href$="vera.html"]').forEach(a=>a.remove());
  }
  const menus=[...document.querySelectorAll('.nav-menu')];
  if(!menus.length)return;
  menus.forEach(menu=>menu.addEventListener('toggle',()=>{
    if(!menu.open)return;
    menus.forEach(other=>{if(other!==menu)other.open=false;});
  }));
  document.addEventListener('click',e=>{
    if(e.target.closest('.nav'))return;
    menus.forEach(menu=>menu.open=false);
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      menus.forEach(menu=>menu.open=false);
      document.activeElement?.blur?.();
    }
  });
  document.querySelectorAll('.nav-menu-panel a').forEach(a=>a.addEventListener('click',()=>{
    const menu=a.closest('.nav-menu');
    if(menu)menu.open=false;
  }));
})();