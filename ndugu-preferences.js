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
  }
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
