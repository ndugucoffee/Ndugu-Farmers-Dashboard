/* Shared EN/NL, UGX/USD preferences for all Ndugu pages.
   Financial data remain source-denominated; the UI converts only on display. */
(function(){
  'use strict';
  var key='ndugu:view-preferences';
  function read(){try{return JSON.parse(localStorage.getItem(key)||'{}')||{};}catch(e){return {};}}
  function write(p){try{localStorage.setItem(key,JSON.stringify(Object.assign(read(),p)));}catch(e){}}
  function setControls(){
    var p=read();
    [['langPills','data-lang',p.lang],['currencyPills','data-currency',p.currency]].forEach(function(args){
      var group=document.getElementById(args[0]);if(!group||!args[2])return;
      var b=group.querySelector('['+args[1]+'="'+args[2]+'"]');
      if(b&&!b.classList.contains('active'))b.click();
    });
    if(p.lang==='en'||p.lang==='nl')document.documentElement.lang=p.lang;
    placeholders(p.lang);
  }
  /* Placeholders and labels the pages' own translation code does not reach
     (the menu's search box): data-ph-en / data-ph-nl, data-aria-nl. */
  function placeholders(lang){
    document.querySelectorAll('[data-ph-en]').forEach(function(el){
      el.placeholder=el.getAttribute(lang==='nl'?'data-ph-nl':'data-ph-en')||el.placeholder;
      if(!el.hasAttribute('data-aria-en'))el.setAttribute('data-aria-en',el.getAttribute('aria-label')||'');
      var a=el.getAttribute(lang==='nl'?'data-aria-nl':'data-aria-en');if(a)el.setAttribute('aria-label',a);
    });
  }
  window.addEventListener('ndugu:preferences',function(e){if(e.detail&&e.detail.lang)placeholders(e.detail.lang);});
  document.addEventListener('click',function(event){
    var b=event.target.closest('#langPills [data-lang],#currencyPills [data-currency]');
    if(!b)return;
    var k=b.hasAttribute('data-lang')?'lang':'currency',v=b.getAttribute('data-'+k);
    if((k==='lang'&&(v==='en'||v==='nl'))||(k==='currency'&&(v==='UGX'||v==='USD'))){
      write({[k]:v});window.dispatchEvent(new CustomEvent('ndugu:preferences',{detail:{[k]:v}}));
    }
  },true);
  window.NDUGU_PREFS={read:read,write:write,sync:setControls};
  if(document.readyState==='complete')setControls();
  else window.addEventListener('load',function(){setControls();},false);
})();
