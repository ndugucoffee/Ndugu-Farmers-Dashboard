/* Internal Resources manager. Browser drafts are local; export resource-catalog.js for deployment. */
(function(){
  'use strict';
  var app=window.NDUGU_RESOURCES_APP;
  var panel=document.getElementById('resourceManagerPanel');
  var toggle=document.getElementById('manageResourcesToggle');
  if(!app||!panel||!toggle)return;
  var form=document.getElementById('resourceEditor');
  var list=document.getElementById('resourceManagerList');
  var status=document.getElementById('resourceManagerStatus');
  var find=document.getElementById('resourceManagerSearch');
  var editorTitle=document.getElementById('resourceEditorHeading');
  var workingId='';
  var locale=app.language();
  var text={
    en:{manage:'Manage resources',close:'Close manager',heading:'Resource management',intro:'Edit resources here. Changes are saved in this browser; download and deploy the catalog to update the website for everyone.',add:'Add resource',published:'Download site catalog',backup:'Backup JSON',import:'Import JSON',reset:'Restore published',search:'Find a resource…',library:'Library entries',name:'Resource',group:'Category',link:'Link',edit:'Edit',remove:'Delete',formAdd:'New resource',formEdit:'Edit resource',enTitle:'Name (English)',nlTitle:'Name (Dutch)',enDesc:'Description (English)',nlDesc:'Description (Dutch)',url:'Resource URL / document path',urlNote:'Use https://, mailto: or a local path such as docs/manual.pdf. Upload files to your site separately.',save:'Save resource',cancel:'Cancel',stored:'Saved in this browser. Export the catalog to publish for everyone.',session:'Saved for this session only; browser storage is unavailable. Export a catalog to preserve your edits.',empty:'No resources match.',available:'Linked',unavailable:'Link pending',confirmDelete:'Delete this resource from your local draft?',confirmReset:'Discard this browser draft and restore the published resources?',deleteDone:'Resource deleted.',resetDone:'Published resources restored.',importDone:'Resources imported.',invalid:'Please enter a valid name and resource link.',duplicate:'That resource ID already exists.',badFile:'Invalid catalogue. Import a JSON backup exported from this manager.',bigFile:'File exceeds the 1 MB import limit.',max:'Maximum 300 resources.',count:'resources',sample:'You are editing a local draft; no live-site changes have been published.',publishReady:'Catalog file downloaded. Replace resource-catalog.js in the website project, then redeploy.',backupReady:'JSON backup downloaded.',required:'Required',newPlaceholder:'e.g. Training manual',nlPlaceholder:'e.g. Trainingshandleiding',descPlaceholder:'Briefly describe the resource'},
    nl:{manage:'Bronnen beheren',close:'Beheer sluiten',heading:'Bronnenbeheer',intro:'Bewerk bronnen hier. Wijzigingen worden in deze browser opgeslagen; download en publiceer de catalogus om de website voor iedereen bij te werken.',add:'Bron toevoegen',published:'Sitecatalogus downloaden',backup:'JSON-back-up',import:'JSON importeren',reset:'Gepubliceerde versie herstellen',search:'Zoek een bron…',library:'Bibliotheekvermeldingen',name:'Bron',group:'Categorie',link:'Link',edit:'Bewerken',remove:'Verwijderen',formAdd:'Nieuwe bron',formEdit:'Bron bewerken',enTitle:'Naam (Engels)',nlTitle:'Naam (Nederlands)',enDesc:'Beschrijving (Engels)',nlDesc:'Beschrijving (Nederlands)',url:'Bron-URL / documentpad',urlNote:'Gebruik https://, mailto: of een lokaal pad zoals docs/handleiding.pdf. Upload bestanden afzonderlijk naar de site.',save:'Bron opslaan',cancel:'Annuleren',stored:'In deze browser opgeslagen. Exporteer de catalogus voor publicatie.',session:'Alleen voor deze sessie opgeslagen; browseropslag is niet beschikbaar. Exporteer de catalogus.',empty:'Geen passende bronnen.',available:'Gelinkt',unavailable:'Link ontbreekt',confirmDelete:'Deze bron uit het lokale concept verwijderen?',confirmReset:'Het browserconcept wissen en de gepubliceerde bronnen herstellen?',deleteDone:'Bron verwijderd.',resetDone:'Gepubliceerde bronnen hersteld.',importDone:'Bronnen geïmporteerd.',invalid:'Vul een geldige naam en bronlink in.',duplicate:'Deze bron-ID bestaat al.',badFile:'Ongeldige catalogus. Importeer een JSON-back-up uit dit beheer.',bigFile:'Bestand groter dan de limiet van 1 MB.',max:'Maximaal 300 bronnen.',count:'bronnen',sample:'U bewerkt een lokaal concept; de publieke site is niet bijgewerkt.',publishReady:'Catalogus gedownload. Vervang resource-catalog.js in het websiteproject en publiceer opnieuw.',backupReady:'JSON-back-up gedownload.',required:'Verplicht',newPlaceholder:'bijv. Trainingshandleiding',nlPlaceholder:'bijv. Trainingshandleiding',descPlaceholder:'Beschrijf de bron kort'}
  };
  var fields={id:document.getElementById('resourceId'),group:document.getElementById('resourceGroup'),url:document.getElementById('resourceUrl'),title_en:document.getElementById('resourceTitleEN'),title_nl:document.getElementById('resourceTitleNL'),desc_en:document.getElementById('resourceDescEN'),desc_nl:document.getElementById('resourceDescNL')};
  function T(k){return (text[locale]||text.en)[k]||k;}
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function groupLabel(g){return app.translations()["g_"+g]||g;}
  function sortedCategories(){
    return ['about','farmers','finance','staff'].sort(function(a,b){
      return groupLabel(a).localeCompare(groupLabel(b),locale,{sensitivity:'base'});
    });
  }
  function orderCategoryOptions(){
    var selected=fields.group.value;
    sortedCategories().forEach(function(g){
      var opt=fields.group.querySelector('option[value="'+g+'"]');
      if(opt){opt.textContent=groupLabel(g);fields.group.appendChild(opt);}
    });
    fields.group.value=selected;
  }
  function slug(s){var r=String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70);return r||'resource';}
  function all(){return app.list();}
  function message(s,bad){status.textContent=s;status.classList.toggle('is-error',!!bad);}
  function refreshLabels(){
    locale=app.language();
    orderCategoryOptions();
    panel.querySelectorAll('[data-manage-i18n]').forEach(function(el){el.textContent=T(el.getAttribute('data-manage-i18n'));});
    find.placeholder=T('search');
    fields.title_en.placeholder=T('newPlaceholder');fields.title_nl.placeholder=T('nlPlaceholder');
    fields.desc_en.placeholder=T('descPlaceholder');fields.desc_nl.placeholder=T('descPlaceholder');
    toggle.querySelector('.manage-label').textContent=panel.hidden?T('manage'):T('close');
    document.getElementById('managerCount').textContent=all().length+' '+T('count');
    renderList();
    if(!form.hidden)editorTitle.textContent=T(workingId?'formEdit':'formAdd');
  }
  function renderList(){
    var q=find.value.trim().toLocaleLowerCase(),rows=all().filter(function(x){return !q||[x.title_en,x.title_nl,x.desc_en,x.desc_nl,x.url,groupLabel(x.group)].join(' ').toLocaleLowerCase().includes(q);}).sort(function(a,b){
      var categoryOrder=groupLabel(a.group).localeCompare(groupLabel(b.group),locale,{sensitivity:'base'});
      return categoryOrder||((locale==='nl'?a.title_nl||a.title_en:a.title_en).localeCompare(locale==='nl'?b.title_nl||b.title_en:b.title_en,locale,{sensitivity:'base'}));
    });
    document.getElementById('managerCount').textContent=all().length+' '+T('count');
    list.innerHTML=rows.length?rows.map(function(x){var u=(x.url||'').trim();return '<div class="resource-manage-row"><div class="resource-manage-row-main"><strong>'+esc(locale==='nl'?(x.title_nl||x.title_en):x.title_en)+'</strong><small>'+esc(groupLabel(x.group))+' · '+esc(x.id)+'</small></div><span class="resource-manage-link '+(u?'is-linked':'')+'">'+esc(u?T('available'):T('unavailable'))+'</span><div class="resource-manage-row-actions"><button type="button" data-resource-edit="'+esc(x.id)+'">'+esc(T('edit'))+'</button><button type="button" class="resource-manage-delete" data-resource-delete="'+esc(x.id)+'">'+esc(T('remove'))+'</button></div></div>';}).join(''):'<p class="resource-manager-empty">'+esc(T('empty'))+'</p>';
  }
  function showForm(id){
    var obj=id?all().filter(function(x){return x.id===id;})[0]:null;
    workingId=obj?obj.id:'';
    Object.keys(fields).forEach(function(k){fields[k].value=obj?(obj[k]||''):'';});
    fields.id.value=obj?obj.id:'';
    form.hidden=false;
    editorTitle.textContent=T(obj?'formEdit':'formAdd');
    fields.title_en.focus();
    form.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  function hideForm(){workingId='';form.reset();form.hidden=true;}
  function validateURL(value){
    if(!value)return true;
    if(/^(?:javascript|data|vbscript|file|blob):/i.test(value))return false;
    if(value.indexOf('\\')!==-1||/[<>"\x00-\x1f]/.test(value))return false;
    try{var u=new URL(value,document.baseURI);return ['https:','http:','mailto:'].includes(u.protocol)||(u.protocol==='file:'&&!/^[a-z][a-z\d+.-]*:/i.test(value)&&!value.startsWith('//'));}catch(e){return false;}
  }
  function normalizeItem(x){
    if(!x||typeof x!=='object')throw Error('Invalid item');
    var r={id:String(x.id||'').trim(),group:String(x.group||'').trim(),url:String(x.url||'').trim(),title_en:String(x.title_en||'').trim(),title_nl:String(x.title_nl||'').trim(),desc_en:String(x.desc_en||'').trim(),desc_nl:String(x.desc_nl||'').trim()};
    if(!/^[a-z0-9-]{1,75}$/.test(r.id)||!['staff','farmers','finance','about'].includes(r.group)||!r.title_en||r.title_en.length>120||r.title_nl.length>120||r.desc_en.length>500||r.desc_nl.length>500||r.url.length>1500||!validateURL(r.url))throw Error('Invalid item');
    r.title_nl=r.title_nl||r.title_en;
    r.desc_nl=r.desc_nl||r.desc_en;
    return r;
  }
  function normalizeItems(rows){
    if(!Array.isArray(rows)||rows.length>300)throw Error('Invalid collection');
    var seen={};return rows.map(function(x){var r=normalizeItem(x);if(seen[r.id])throw Error('Duplicate ID');seen[r.id]=1;return r;});
  }
  function save(rows,success){
    var ok=app.save(rows);
    renderList();
    message(ok?success||T('stored'):T('session'),!ok);
  }
  function download(name,content,type){
    var blob=new Blob([content],{type:type||'application/json;charset=utf-8'});
    var url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},3000);
  }
  function catalog(){return {version:1,items:normalizeItems(all())};}
  toggle.addEventListener('click',function(){
    panel.hidden=!panel.hidden;
    toggle.setAttribute('aria-expanded',String(!panel.hidden));
    refreshLabels();
    if(!panel.hidden)document.getElementById('resourceManagerHeading').focus();
    else hideForm();
  });
  document.getElementById('resourceManagerAdd').addEventListener('click',function(){showForm('');});
  document.getElementById('resourceEditorCancel').addEventListener('click',hideForm);
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var o={};Object.keys(fields).forEach(function(k){o[k]=fields[k].value.trim();});
    var rows=all();
    if(!workingId){var base=slug(o.title_en),id=base,n=2;while(rows.some(function(x){return x.id===id;})){id=base+'-'+n++;}o.id=id;}
    else o.id=workingId;
    try{o=normalizeItem(o);}catch(err){message(T('invalid'),true);return;}
    if(rows.length>=300&&!workingId){message(T('max'),true);return;}
    if(workingId)rows=rows.map(function(x){return x.id===workingId?o:x;});else rows.push(o);
    save(rows,T('stored'));hideForm();
  });
  list.addEventListener('click',function(e){
    var edit=e.target.closest('[data-resource-edit]'),del=e.target.closest('[data-resource-delete]');
    if(edit)showForm(edit.getAttribute('data-resource-edit'));
    if(del){var id=del.getAttribute('data-resource-delete');if(!window.confirm(T('confirmDelete')))return;
      save(all().filter(function(x){return x.id!==id;}),T('deleteDone'));
      if(workingId===id)hideForm();}
  });
  find.addEventListener('input',renderList);
  document.getElementById('resourceManagerPublish').addEventListener('click',function(){
    var js='/* Published Ndugu resource catalogue — managed in Internal Resources. */\nwindow.NDUGU_RESOURCE_CATALOG = '+JSON.stringify(catalog(),null,2)+';\n';
    download('resource-catalog.js',js,'text/javascript;charset=utf-8');message(T('publishReady'));
  });
  document.getElementById('resourceManagerBackup').addEventListener('click',function(){download('resource-catalog-backup.json',JSON.stringify(catalog(),null,2)+'\n');message(T('backupReady'));});
  document.getElementById('resourceManagerRestore').addEventListener('click',function(){if(!window.confirm(T('confirmReset')))return;app.reset();hideForm();refreshLabels();message(T('resetDone'));});
  document.getElementById('resourceManagerImport').addEventListener('change',function(e){
    var file=e.target.files&&e.target.files[0];e.target.value='';if(!file)return;
    if(file.size>1048576){message(T('bigFile'),true);return;}
    var reader=new FileReader();
    reader.onload=function(){try{var data=JSON.parse(reader.result),rows=normalizeItems(data.items);save(rows,T('importDone'));hideForm();}catch(err){message(T('badFile'),true);}};
    reader.onerror=function(){message(T('badFile'),true);};
    reader.readAsText(file);
  });
  window.addEventListener('ndugu-resources-language',refreshLabels);
  refreshLabels();
})();
