/* Ndugu results dashboards · a visual performance view modelled on the Impact dashboard.
 * DEMO is explicitly illustrative; LIVE only uses source-backed observations.
 * The workbook provides definitions/targets, never achieved results.
 */
(function () {
  'use strict';
  var def=window.NDUGU_KPI_TREE;
  var main=document.querySelector('main[data-kpi-section]');
  if (!def || !main) return;
  var section=main.getAttribute('data-kpi-section'), entries=(def.sections||{})[section];
  if (!entries) return;
  var root=document.getElementById('ndg-kpi'), old=document.getElementById('ndg-legacy');
  var tabs=Array.prototype.slice.call(main.querySelectorAll('.ndg-tab'));
  var index={}; entries.forEach(function(x){index[x.id]=x;});
  var cfg={
    domestic:{title:'Domestic Trade Performance',eyebrow:'Domestic Trade · results dashboard',
      subtitle:'Trading volumes, buyer deliveries, revenue, premiums and certification results.',
      featured:['domestic-8','domestic-9','domestic-10','domestic-11','domestic-12','domestic-13','domestic-16','domestic-17','domestic-40','domestic-27'],
      progress:['domestic-8','domestic-9','domestic-10','domestic-11','domestic-12','domestic-13','domestic-16','domestic-17','domestic-40'],
      breakdown:['domestic-11','domestic-12','domestic-13'],breakdownTitle:'Where traded volumes go',
      breakdownSubtitle:'Deliveries by buyer or export channel · tonnes',
      labels:{'domestic-8':'Coffee traded','domestic-9':'Sourced from cooperatives','domestic-10':'Sourced from traders','domestic-11':'Delivered to Ugacof','domestic-12':'Delivered to ETG','domestic-13':'Channelled to export','domestic-16':'Sales revenue','domestic-17':'Premium revenue','domestic-40':'Certified farmers','domestic-27':'Trade advances'}},
    export:{title:'Ndugu Export Performance',eyebrow:'Ndugu Export · results dashboard',
      subtitle:'Coffee purchasing, processing, export volumes, sales and supplier engagement.',
      featured:['export-10','export-22','export-23','export-26','export-27','export-28','export-37','export-38','export-41','export-43'],
      progress:['export-10','export-22','export-23','export-26','export-27','export-28','export-37','export-38','export-41'],
      breakdown:['export-26','export-27','export-28'],breakdownTitle:'Coffee intake by location',
      breakdownSubtitle:'Purchases at Luvule and Kampala sites · tonnes',
      labels:{'export-10':'FAQ coffee purchased','export-22':'Graded coffee · screen 1800','export-23':'Graded coffee · screen 1500','export-26':'Purchased at Luvule','export-27':'Purchased at Edge','export-28':'Purchased at Darley','export-37':'RFA coffee exported','export-38':'Speciality coffee exported','export-41':'Export sales revenue','export-43':'Milling revenue'}},
    production:{title:'Ndugu Production Performance',eyebrow:'Ndugu Production · results dashboard',
      subtitle:'Farmer inputs, planting material, agronomy training and agroforestry outcomes.',
      featured:['production-2','production-3','production-5','production-8','production-32','production-36','production-47','production-48','production-49','production-70'],
      progress:['production-2','production-3','production-5','production-8','production-32','production-36','production-47','production-48','production-49'],
      breakdown:['production-47','production-48','production-49'],breakdownTitle:'Shade trees by distribution partner',
      breakdownSubtitle:'Reported distributions by partner · trees',
      labels:{'production-2':'Organic input bags distributed','production-3':'Inorganic input bags distributed','production-5':'Coffee seedlings supplied','production-8':'Shade trees supplied','production-32':'Carbon-credit beneficiaries','production-36':'Farmers trained in safe agrochemical use','production-47':'Shade trees · Bulungi','production-48':'Shade trees · Solidaridad','production-49':'Shade trees · ETG','production-70':'Seedling survival · 6 months'}}
  }[section];
  var savedPrefs={};try{savedPrefs=JSON.parse(localStorage.getItem('ndugu:view-preferences')||'{}');}catch(e){}
  var lang=savedPrefs.lang==='nl'?'nl':'en',currency=savedPrefs.currency==='USD'?'USD':'UGX',view=savedPrefs.view==='annual'?'annual':'seasonal',year=/^20\d\d$/.test(savedPrefs.year)?savedPrefs.year:'all',quarter=/^Q[1-4]$/.test(savedPrefs.quarter)?savedPrefs.quarter:'all';
  var FX_RATE=(Number(savedPrefs.fxRate)>=100&&Number(savedPrefs.fxRate)<=100000)?Number(savedPrefs.fxRate):3777; // Adjustable reference rate; not a live FX quote.
  var current='kpi',mode='demo',selected=cfg.featured[0],compare='',horizon=8,search='',resultFilter='all',sortBy='framework',page=0,detailId='',detailTab='overview',detailPoint=-1,detailRawPoint='',sourceActuals={},manualActuals={},actuals={},opReady=section==='production';
  var NL=(window.NDUGU_KPI_TRANSLATIONS||{});var translations=NL.labels||{},metricNL=NL.names||{};
  var headlineNames={
    domestic:{'domestic-8':['Coffee traded','Verhandelde koffie'],'domestic-9':['Cooperatives','Coöperaties'],'domestic-10':['Traders','Handelaren'],'domestic-16':['Sales revenue','Verkoopomzet'],'domestic-17':['Premium revenue','Premie-inkomsten'],'domestic-40':['Certified farmers','Gecertificeerde boeren'],'domestic-11':['Ugacof deliveries','Leveringen Ugacof'],'domestic-12':['ETG deliveries','Leveringen ETG'],'domestic-13':['Export channel','Exportkanaal'],'domestic-27':['Trade advances','Handelsvoorschotten'],'domestic-24':['Finance reached','Financiering bereik'],'domestic-31':['Coffee batched','Gebatchte koffie']},
    export:{'export-10':['Coffee purchased','Ingekochte koffie'],'export-26':['Luvule intake','Inkoop Luvule'],'export-37':['RFA exports','RFA-export'],'export-38':['Speciality exports','Specialiteitsexport'],'export-41':['Export revenue','Exportomzet'],'export-43':['Milling revenue','Maalomzet'],'export-22':['Grade 1800','Sortering 1800'],'export-23':['Grade 1500','Sortering 1500'],'export-27':['Edge intake','Inkoop Edge'],'export-28':['Darley intake','Inkoop Darley'],'export-39':['Fairtrade exports','Fairtrade-export'],'export-51':['Traders onboarded','Handelaren aangesloten']},
    production:{'production-2':['Organic inputs','Organische inputs'],'production-5':['Coffee seedlings','Koffiezaailingen'],'production-8':['Shade trees','Schaduwbomen'],'production-32':['Carbon beneficiaries','CO₂-begunstigden'],'production-36':['Farmers trained','Getrainde boeren'],'production-70':['6-month survival','Overleving na 6 mnd'],'production-3':['Inorganic inputs','Anorganische inputs'],'production-47':['Bulungi trees','Bomen Bulungi'],'production-48':['Solidaridad trees','Bomen Solidaridad'],'production-49':['ETG trees','Bomen ETG'],'production-68':['Total beneficiaries','Totaal begunstigden'],'production-71':['12-month survival','Overleving na 12 mnd']}
  }[section];
  function headlineTitle(e){var pair=headlineNames[e.id];return pair?pair[lang==='nl'?1:0]:title(e);}
  function tx(value){if(lang!=='nl')return value;var val=String(value==null?'':value),k=val.trim();
    if(Object.prototype.hasOwnProperty.call(translations,k))return val.replace(k,translations[k]);
    // Longer phrases first; many rendered nodes include an icon, punctuation or a value.
    Object.keys(translations).filter(function(key){return key.length>14;}).sort(function(a,b){return b.length-a.length;}).forEach(function(key){
      if(val.indexOf(key)>=0)val=val.split(key).join(translations[key]);
    });
    return val.replace(/% of plan/g,'% van doel').replace(/% vs prior observation/g,'% t.o.v. vorige waarneming')
      .replace(/Showing (\d+)–(\d+) of (\d+) matching measures/g,'Getoond: $1–$2 van $3 maatstaven')
      .replace(/matching measures/g,'overeenkomende maatstaven').replace(/^(Explore) /,'Verken ').replace(/^(Open) /,'Open ')
      .replace(/\bQ([1-4]) (20\d\d)\b/g,'K$1 $2');}
  function localizeDom(node){if(lang!=='nl'||!node)return;var walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT),n;
    while((n=walker.nextNode())){if(n.parentNode && !/^(SCRIPT|STYLE)$/i.test(n.parentNode.nodeName)){var old=n.nodeValue,newVal=tx(old);if(newVal!==old)n.nodeValue=newVal;}}
    Array.prototype.forEach.call(node.querySelectorAll('input[placeholder],button[aria-label],select[aria-label]'),function(el){['placeholder','aria-label'].forEach(function(k){var v=el.getAttribute(k);if(v)el.setAttribute(k,tx(v));});});}
  function savePrefs(){try{var vals={lang:lang,currency:currency,view:view,year:year,quarter:quarter};var old=JSON.parse(localStorage.getItem('ndugu:view-preferences')||'{}');vals.fxRate=FX_RATE;localStorage.setItem('ndugu:view-preferences',JSON.stringify(Object.assign(old,vals)));}catch(e){}}
  function convert(v,from,to){if(v===null||v===undefined)return null;if(from===to)return v;if(from==='UGX'&&to==='USD')return v/FX_RATE;if(from==='USD'&&to==='UGX')return v*FX_RATE;return v;}
  function display(v,u){return (u==='UGX'||u==='USD')?convert(v,u,currency):v;}
  function displayUnit(u){return u==='UGX'||u==='USD'?currency:u;}
  function labelPeriod(l){return lang==='nl'?String(l).replace(/Q([1-4])/g,'K$1'):l;}
  function rawHistory(a){var rows=a&&Array.isArray(a.history)?a.history:[];return rows.map(function(r){return {label:String(r.period||r.date||r.label||''),value:clean(r.value)};}).filter(function(r){return r.value!==null;});}
  function matchesPeriod(r){var m=r.label.match(/Q([1-4])\s*(20\d\d)/i);if(m)return {q:'Q'+m[1],y:m[2]};
    var reversed=r.label.match(/\b(20\d\d)[-\s]*Q([1-4])\b/i);if(reversed)return {q:'Q'+reversed[2],y:reversed[1]};
    var iso=r.label.match(/^(20\d\d)[-\/](0?[1-9]|1[0-2])(?:[-\/]|$)/);if(iso)return {q:'Q'+Math.ceil(Number(iso[2])/3),y:iso[1]};
    var y=r.label.match(/\b(20\d\d)\b/);return {q:'',y:y?y[1]:''};}
  function periodHistory(a){var h=rawHistory(a);
    if(view==='annual'){var years=[],map={};h.forEach(function(r){var yy=matchesPeriod(r).y;if(!yy)return;if(!map[yy])years.push(yy);map[yy]={label:yy,value:r.value};});return years.filter(function(y){return year==='all'||year===y;}).map(function(y){return map[y];});}
    return h.filter(function(r){var p=matchesPeriod(r);return (year==='all'||p.y===year)&&(quarter==='all'||p.q===quarter);});}
  function availableHistory(){return rawHistory(exampleResults[cfg.featured[0]]).concat(entries.reduce(function(acc,e){return acc.concat(rawHistory(actuals[e.id]));},[]));}
  function availableYears(){var years=[];availableHistory().forEach(function(r){var y=matchesPeriod(r).y;if(y&&years.indexOf(y)<0)years.push(y);});return years.sort();}
  function availableQuarters(){var qs=[];availableHistory().forEach(function(r){var p=matchesPeriod(r);if((year==='all'||p.y===year)&&p.q&&qs.indexOf(p.q)<0)qs.push(p.q);});return qs.sort();}
  function syncPageHeader(field,value){var id=field==='lang'?'langPills':field==='currency'?'currencyPills':'seasonPills',selector=field==='lang'?'data-lang':field==='currency'?'data-currency':'data-season',btn=document.querySelector('#'+id+' ['+selector+'="'+value+'"]');if(btn&&!btn.classList.contains('active'))btn.click();}
  
  // All sample values and quarterly histories are explicitly marked synthetic.
  // Reported mode never silently substitutes fictional values.
  var illustrative=(window.NDUGU_KPI_ILLUSTRATIVE||{}).sections || {};
  var exampleResults=illustrative[section]||{};
  var theme={domestic:{eyebrow:'DOMESTIC TRADE / INTELLIGENCE',accent:'#0E564C',title:'Domestic trade',tag:'Volumes · deliveries · revenue',groups:[{name:'Sourcing channels',description:'Volumes sourced from cooperatives and traders',ids:['domestic-9','domestic-10']},{name:'Delivery destinations',description:'Buyer and export-channel volumes',ids:['domestic-11','domestic-12','domestic-13']}]},export:{eyebrow:'EXPORT / INTELLIGENCE',accent:'#0E564C',title:'Ndugu export',tag:'Purchases · exports · sales',groups:[{name:'Purchasing locations',description:'Coffee intake by purchasing location',ids:['export-26','export-27','export-28']},{name:'Export sales segments',description:'Volumes sold by selected certification or speciality type',ids:['export-37','export-38']}]},production:{eyebrow:'PRODUCTION / INTELLIGENCE',accent:'#0E564C',title:'Ndugu production',tag:'Inputs · farmers · trees',groups:[{name:'Fertilizer inputs',description:'Bags distributed by input type',ids:['production-2','production-3']},{name:'Shade-tree distribution partners',description:'Reported distributions among named partners',ids:['production-47','production-48','production-49']}]}}[section];
  var priority={domestic:['domestic-8','domestic-9','domestic-10','domestic-16','domestic-17','domestic-40','domestic-11','domestic-12','domestic-13','domestic-27','domestic-24','domestic-31'],export:['export-10','export-26','export-37','export-38','export-41','export-43','export-22','export-23','export-27','export-28','export-39','export-51'],production:['production-2','production-5','production-8','production-32','production-36','production-70','production-3','production-47','production-48','production-49','production-68','production-71']}[section];
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function clean(v){return v===null||v===undefined||v===''||!isFinite(Number(v))?null:Number(v);}
  function num(v,n){return Number(v).toLocaleString(lang==='nl'?'nl-NL':'en-UG',{maximumFractionDigits:n==null?1:n});}
  function compact(v){if(v===null)return '—';if(Math.abs(v)>=1e9)return num(v/1e9,2)+'B';if(Math.abs(v)>=1e6)return num(v/1e6,1)+'M';if(Math.abs(v)>=1e4)return num(v/1000,1)+'k';return num(v,Math.abs(v)<100?1:0);}
  function fmt(v,u,short){if(v===null)return '—';var shown=display(v,u),val=short?compact(shown):num(shown,Math.abs(shown)<100?2:0);if(u==='UGX'||u==='USD')return currency+' '+val;return val+({tonnes:' t',litres:' L',trees:' trees',seedlings:' seedlings',bags:' bags',farmers:' farmers'}[u]||'');}
  function title(e){return lang==='nl'?(metricNL[e.id]||cfg.labels[e.id]||e.name):(cfg.labels[e.id]||e.name);}
  function seed(id){var h=0;for(var i=0;i<id.length;i++)h=(h*37+id.charCodeAt(i))%10009;return h;}
  function demoActual(id){
    var row=exampleResults[id];
    return row?{value:row.value,unit:row.unit,source:row.source,as_of:row.as_of,history:row.history,illustrative:true}:null;
  }
  function item(id){
    var e=index[id];if(!e)return null;
    var a=mode==='live'?actuals[id]:demoActual(id),h=periodHistory(a);
    var v=h.length?h[h.length-1].value:null;
    // No dated history: latest source result is applicable only in the unfiltered view.
    if(!h.length&&a&&year==='all'&&quarter==='all')v=clean(a.value);
    var row=exampleResults[id],target=clean(e.target),illustrativeTarget=false;
    if(mode==='demo'&&target===null&&row){target=clean(row.target);illustrativeTarget=target!==null;}
    var srcUnit=a?(a.unit||e.unit):e.unit;
    var compatible=srcUnit===e.unit||((srcUnit==='UGX'||srcUnit==='USD')&&(e.unit==='UGX'||e.unit==='USD'));
    return {e:e,a:a,v:v,target:target,illustrativeTarget:illustrativeTarget,
      ratio:v!==null&&target!==null&&target>0&&compatible?convert(v,srcUnit,e.unit)/target:null};
  }
  function percent(it){return it&&it.ratio!==null?Math.round(100*it.ratio):null;}
  function status(it){if(it.v===null)return ['Awaiting result','missing'];if(it.target===null)return ['Reported · no target','plain'];if(it.ratio===null)return ['Review units','missing'];if(it.ratio>=1)return ['Target achieved','good'];if(it.ratio>=.75)return ['On track','steady'];return ['Below plan','caution'];}
  function series(it){return !it||it.v===null?[]:periodHistory(it.a);}
  function history(it){var h=series(it);return horizon==='all'?h:h.slice(-Number(horizon));}
  function delta(it){var h=series(it);if(h.length<2||h[h.length-2].value===0)return null;return (h[h.length-1].value-h[h.length-2].value)/Math.abs(h[h.length-2].value)*100;}
  function badge(it){var s=status(it);return '<span class="ndx-status ndx-'+s[1]+'">'+esc(s[0])+'</span>';}
  function symbol(n){return n>=0?'↗':'↘';}
  function smallSpark(it){var h=series(it).slice(-8),max=0,w=120,baseY=40,gap=4,bw;
    h.forEach(function(x){if(x.value>max)max=x.value;});
    if(h.length<2||!max)return '<span class="ndx-no-spark">History pending</span>';
    bw=(w-((h.length-1)*gap))/h.length;
    return '<svg viewBox="0 0 120 42" aria-hidden="true" class="ndx-spark">'+h.map(function(p,i){var height=Math.max(6,(p.value/max)*28),x=(bw+gap)*i,y=baseY-height,cls=i===h.length-1?' ndx-last':'';return '<rect class="ndx-spark-bar'+cls+'" x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+height.toFixed(1)+'" rx="3" ry="3"></rect>';}).join('')+'</svg>';}
  function miniProgress(it){var p=percent(it),label=p!==null?p+'% of plan':it.target===null?'Target pending':'Awaiting result',width=p===null?0:Math.max(8,Math.min(100,p));
    return '<div class="ndx-mini-progress"><span class="ndx-mini-progress-label">'+esc(label)+'</span><span class="ndx-mini-progress-track"><i style="width:'+width+'%"></i></span></div>';}
  function topCard(id,i){var it=item(id);if(!it)return '';var p=percent(it),u=it.a&&it.a.unit||it.e.unit;
    var foot=p!==null?tx('Target')+' '+fmt(it.target,it.e.unit,true)+' · '+p+'%':it.target!==null?tx('Target')+' '+fmt(it.target,it.e.unit,true):tx('Open details');
    return '<button type="button" class="ndx-summary-card ndx-card-'+i+'" data-inspect="'+esc(id)+'" title="'+esc(tx('Open details')+': '+title(it.e))+'"><span class="ndx-toplabel">'+esc(headlineTitle(it.e))+'</span><span class="ndx-bigval">'+esc(fmt(it.v,u,true))+'</span><span class="ndx-tile-foot">'+esc(tx(foot))+'</span></button>';}
  function pillToggle(){return '<div class="ndx-toggle" role="group" aria-label="Data status"><button type="button" data-mode="live" aria-pressed="'+(mode==='live')+'">Reported</button><button type="button" data-mode="demo" aria-pressed="'+(mode==='demo')+'">Illustrative</button></div>';}
  function toolbar(){var ys=availableYears(),qs=availableQuarters();if(quarter!=='all'&&qs.indexOf(quarter)<0)quarter='all';
    return '<div class="ndx-global-filters" role="group" aria-label="Report filters">'
      +'<label><span>'+tx('Time view')+'</span><select id="ndx-view" aria-label="'+tx('Time view')+'"><option value="annual"'+option('annual',view)+'>'+tx('Annual')+'</option><option value="seasonal"'+option('seasonal',view)+'>'+tx('Seasonal')+'</option></select></label>'
      +'<label><span>'+tx('Year')+'</span><select id="ndx-year"><option value="all"'+option('all',year)+'>'+tx('All years')+'</option>'+ys.map(function(y){return '<option value="'+y+'"'+option(y,year)+'>'+y+'</option>';}).join('')+'</select></label>'
      +(view==='seasonal'?'<label><span>'+tx('Quarter')+'</span><select id="ndx-quarter"><option value="all"'+option('all',quarter)+'>'+tx('All quarters')+'</option>'+qs.map(function(q){return '<option value="'+q+'"'+option(q,quarter)+'>'+labelPeriod(q)+'</option>';}).join('')+'</select></label>':'')
      +'<label><span>'+tx('Currency')+'</span><select id="ndx-currency"><option value="UGX"'+option('UGX',currency)+'>UGX</option><option value="USD"'+option('USD',currency)+'>USD</option></select></label>'+(currency==='USD'?'<label class="ndx-fx-control"><span>'+tx('FX reference')+' (UGX / USD)</span><input id="ndx-fx" type="number" min="100" max="100000" step="1" value="'+FX_RATE+'" aria-label="'+tx('FX reference')+'"></label>':'')
      +'<p class="ndx-filter-hint">'+tx('Annual: year-end value · Seasonal: quarters · FX: reference rate')+'</p></div>';
  }
  function changePref(k,v){if(k==='view'){view=v==='annual'?'annual':'seasonal';quarter='all';}
    if(k==='year'){year=/^20\d\d$/.test(v)?v:'all';quarter='all';}
    if(k==='quarter')quarter=/^Q[1-4]$/.test(v)?v:'all';
    if(k==='currency')currency=v==='USD'?'USD':'UGX';
    if(k==='fxRate'&&Number(v)>=100&&Number(v)<=100000)FX_RATE=Number(v);
    if(k==='lang')lang=v==='nl'?'nl':'en';
    detailPoint=-1;detailRawPoint='';page=0;savePrefs();renderOverview();
    if(k==='year')syncPageHeader('season',year);if(k==='currency')syncPageHeader('currency',currency);}
  function notice(){return mode==='demo'?'<span class="ndx-dot amber"></span><b>'+tx('Illustrative data')+'</b> · '+tx('For preview only'):'<span class="ndx-dot green"></span><b>'+tx('Reported data')+'</b> · '+tx('Verified values only');}
  function option(id,val){return id===val?' selected':'';}
  function metricOptions(onlySameUnit){return entries.map(function(e){return e.id;}).filter(function(id){return index[id]&&(!onlySameUnit||index[id].unit===index[selected].unit);}).map(function(id){return '<option value="'+esc(id)+'"'+option(id,onlySameUnit?compare:selected)+'>'+esc(title(index[id]))+'</option>';}).join('');}
  function chartSvg(it,other,mini){var s=history(it),ss=other?history(other).filter(function(row){return s.some(function(x){return x.label===row.label;});}):[],u=(it.a&&it.a.unit)||it.e.unit;
    if(!s.length)return '<div class="ndx-empty"><b>'+tx('Historical observations unavailable')+'</b><p>'+tx('Choose another period.')+'</p></div>';
    var w=750,h=mini?210:285,left=62,right=25,top=23,bottom=55;
    var u2=other&&other.a&&(other.a.unit||other.e.unit)||other&&other.e.unit||u;
    var all=s.map(function(z){return display(z.value,u);}).concat(ss.map(function(z){return display(z.value,u2);})),max=Math.max.apply(null,all.concat(it.target===null?[]:[display(it.target,it.e.unit)]))*1.12||1,min=Math.min(0,Math.min.apply(null,all)),y=function(v){return top+(1-(v-min)/(max-min||1))*(h-top-bottom);},x=function(i,n){return left+(s.length===1?(w-left-right)/2:i*(w-left-right)/Math.max(1,n-1));};
    var paths=function(arr,aligned){return arr.map(function(v,i){var ix=aligned?s.findIndex(function(z){return z.label===v.label;}):i;return (i?'L':'M')+x(ix,aligned?s.length:arr.length).toFixed(1)+' '+y(display(v.value,aligned?u2:u)).toFixed(1);}).join(' ');};
    var guides=[0,.25,.5,.75,1].map(function(k){var yy=y(min+(max-min)*k);return '<line x1="'+left+'" y1="'+yy+'" x2="'+(w-right)+'" y2="'+yy+'" stroke="#E3EAE1" stroke-dasharray="4 5"/><text x="'+(left-10)+'" y="'+(yy+3)+'" text-anchor="end" class="ndx-axis">'+esc(compact(min+(max-min)*k))+'</text>';}).join('');
    var target=it.target!==null?'<line x1="'+left+'" y1="'+y(display(it.target,it.e.unit))+'" x2="'+(w-right)+'" y2="'+y(display(it.target,it.e.unit))+'" stroke="#BE8A35" stroke-width="1.5" stroke-dasharray="7 5"/>':'';
    var p=paths(s),area=p+' L'+x(s.length-1,s.length)+' '+y(min)+' L'+(s.length===1?x(0,1):left)+' '+y(min)+' Z';
    var labels=s.map(function(v,i){return i%Math.max(1,Math.ceil(s.length/5))===0||i===s.length-1?'<text x="'+x(i,s.length)+'" y="'+(h-16)+'" text-anchor="middle" class="ndx-axis">'+esc(labelPeriod(v.label))+'</text>':'';}).join('');
    var dots=s.map(function(v,i){return '<circle class="ndx-plot-point" data-period="'+i+'" tabindex="0" role="button" aria-label="Explore '+esc(labelPeriod(v.label))+'" cx="'+x(i,s.length)+'" cy="'+y(display(v.value,u))+'" r="5.5" fill="#fff" stroke="var(--ndx-accent)" stroke-width="2.6"><title>'+esc(v.label+': '+fmt(v.value,u))+'</title></circle>';}).join('');
    return '<svg class="ndx-chart" viewBox="0 0 '+w+' '+h+'" role="group" aria-label="Time series, select a point to inspect the period" xmlns="http://www.w3.org/2000/svg">'+guides+target+'<path d="'+area+'" fill="var(--ndx-accent-soft)"/><path d="'+p+'" fill="none" stroke="var(--ndx-accent)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'+(ss.length>=2?'<path d="'+paths(ss)+'" fill="none" stroke="#287C78" stroke-width="2.5" stroke-dasharray="6 4"/>':'')+dots+labels+'</svg>';
  }
  // Domestic only: certification scheme counts, sourced from four existing KPIs.
  // Schemes may overlap, so these are deliberately NOT pieces of a pie/100% stack.
  function certificationsPane(){
    var schemes=[
      {id:'domestic-41',en:'Rainforest Alliance (RFA)',nl:'Rainforest Alliance (RFA)',color:'#0E564C'},
      {id:'domestic-42',en:'4C',nl:'4C',color:'#287C78'},
      {id:'domestic-43',en:'Fairtrade',nl:'Fairtrade',color:'#BE8A35'},
      {id:'domestic-44',en:'Sucafina Impact',nl:'Sucafina Impact',color:'#517A9D'}
    ];
    var results=schemes.map(function(s){return {scheme:s,metric:item(s.id)};});
    var valid=results.filter(function(r){return r.metric&&r.metric.v!==null&&r.metric.v>=0;});
    var max=Math.max.apply(null,valid.map(function(r){return r.metric.v;}));
    if(!isFinite(max)||max<=0)max=1;
    var total=item('domestic-40');
    var heading=lang==='nl'?'Certificeringsoverzicht':'Certification breakdown';
    var sub=lang==='nl'?'Boeren per certificeringsprogramma':'Farmers by certification programme';
    var countLabel=lang==='nl'?'gecertificeerde boeren':'certified farmers';
    var overlap=lang==='nl'?'Een boer kan onder meerdere programma’s vallen; deze aantallen mogen niet worden opgeteld.':'A farmer can belong to multiple programmes; these counts must not be added together.';
    var empty=lang==='nl'?'Nog geen certificeringsgegevens voor de gekozen periode.':'No certification counts available for the selected reporting period.';
    var rows=results.map(function(r){
      var value=r.metric?r.metric.v:null,shown=value===null?'—':num(value,0),pct=value===null?0:Math.max(0,Math.min(100,value/max*100));
      var label=r.scheme[lang];
      return '<button type="button" class="ndx-cert-row" data-inspect="'+esc(r.scheme.id)+'" title="'+esc(label)+'" aria-label="'+esc(label+': '+shown)+'">'
        +'<span class="ndx-cert-name"><i style="background:'+r.scheme.color+'"></i>'+esc(label)+'</span>'
        +'<span class="ndx-cert-track"><i style="width:'+pct.toFixed(1)+'%;background:'+r.scheme.color+'"></i></span>'
        +'<strong>'+esc(shown)+'</strong></button>';
    }).join('');
    return '<section class="ndx-certifications" aria-labelledby="ndx-cert-title">'
      +'<div class="ndx-cert-heading"><div><h3 id="ndx-cert-title">'+heading+'</h3><p>'+sub+'</p></div>'
      +'<div class="ndx-cert-total"><span>'+countLabel+'</span><b>'+(total&&total.v!==null?esc(num(total.v,0)):'—')+'</b></div></div>'
      +(valid.length?'<div class="ndx-cert-list">'+rows+'</div>':'<div class="ndx-cert-empty">'+empty+'</div>')
      +'<p class="ndx-cert-foot">'+overlap+'</p></section>';
  }
  function rhythmPane(it){
    var rows=history(it),u=(it.a&&it.a.unit)||it.e.unit,hasTarget=it.target!==null&&it.target>0;
    if(!rows.length)return '<div class="ndx-rhythm ndx-rhythm-empty">'+tx('Choose a reporting period')+'</div>';
    var variant=section==='domestic'?'shifts':section==='export'?'attainment':'trajectory';
    var heading=section==='domestic'?'Period changes':section==='export'?'Target pace':'Delivery profile';
    var values=rows.map(function(r){return display(r.value,u);});
    var high=Math.max.apply(null,values.concat(hasTarget?[display(it.target,it.e.unit)]:[]))||1;
    var changes=rows.map(function(r,i){return i&&rows[i-1].value!==0?(r.value-rows[i-1].value)/Math.abs(rows[i-1].value)*100:0;});
    var absMax=Math.max(1,Math.max.apply(null,changes.map(Math.abs)));
    var bars=rows.map(function(r,i){
      var current=values[i],change=changes[i],pct=hasTarget?Math.round(current/display(it.target,it.e.unit)*100):null;
      var ht=variant==='shifts'?Math.max(3,Math.abs(change)/absMax*38):Math.max(5,Math.min(100,current/high*100));
      var label=labelPeriod(r.label),detail=variant==='shifts'?(i===0?'—':(change>0?'+':'')+num(change,1)+'%'):pct!==null?pct+'%':fmt(r.value,u,true);
      var color=variant==='shifts'?(change<0?'neg':'pos'):(variant==='attainment'?'teal':'green');
      var titleText=label+' · '+fmt(r.value,u)+(i?' · '+(change>0?'+':'')+num(change,1)+'%':'');
      return '<button type="button" class="ndx-rhythm-period" data-period="'+i+'" title="'+esc(titleText)+'" aria-label="'+esc(titleText)+'"><span class="ndx-rhythm-track '+variant+'"><span class="ndx-rhythm-bar '+color+'" style="height:'+ht.toFixed(1)+'%"></span>'+(variant==='attainment'&&hasTarget?'<span class="ndx-rhythm-goal" style="bottom:'+(Math.min(100,display(it.target,it.e.unit)/high*100))+'%"></span>':'')+'</span><strong>'+esc(detail)+'</strong><small>'+esc(label)+'</small></button>';
    }).join('');
    return '<div class="ndx-rhythm ndx-rhythm-'+variant+'"><div class="ndx-rhythm-heading"><h3>'+esc(tx(heading))+'</h3><span>'+esc(variant==='shifts'?tx('Change vs prior period'):variant==='attainment'?tx('Progress toward target'):tx('Selected metric by period'))+'</span></div><div class="ndx-rhythm-grid">'+bars+'</div></div>';
  }
  function peerPane(it){
    var all=entries.map(function(e){return item(e.id);}).filter(function(x){return x&&x.v!==null;});
    var goalMode=section==='production',rows=goalMode?
      all.filter(function(x){return priority.indexOf(x.e.id)>=0&&x.ratio!==null;}).sort(function(a,b){return (b.ratio||0)-(a.ratio||0);}).slice(0,5):
      all.filter(function(x){return x.e.unit===it.e.unit;}).sort(function(a,b){return b.v-a.v;}).slice(0,5);
    if(!rows.some(function(x){return x.e.id===it.e.id})&&it.v!==null){if(rows.length>=5)rows.pop();rows.unshift(it);}
    var max=goalMode?Math.max(1,Math.max.apply(null,rows.map(function(x){return x.ratio||0;}))):Math.max(1,Math.max.apply(null,rows.map(function(x){return x.v||0;})));
    return '<div class="ndx-peer"><h3>'+tx(goalMode?'Output target coverage':'Comparable results')+'</h3><div class="ndx-peer-list">'+rows.map(function(x,i){
      var measure=goalMode?(x.ratio||0):x.v,width=Math.min(100,Math.max(0,measure/max*100));
      return '<button type="button" class="ndx-peer-row'+(x.e.id===selected?' active':'')+'" data-select="'+esc(x.e.id)+'" title="'+esc(title(x.e))+'"><span class="ndx-peer-name">'+esc(title(x.e))+'</span><span class="ndx-peer-track"><i style="width:'+width.toFixed(1)+'%;background:'+(['#0E564C','#287C78','#BE8A35','#517A9D','#87A86F'][i%5])+'"></i></span><strong>'+esc(goalMode?percent(x)+'%':fmt(x.v,x.a&&x.a.unit||x.e.unit,true))+'</strong></button>';
    }).join('')+'</div></div>';
  }
  function chartPane(){var it=item(selected),d=delta(it),p=percent(it),comp=compare?item(compare):null;return '<div class="ndx-surface ndx-trend" id="ndx-trend-surface"><div class="ndx-surface-head"><div><h2>Trends</h2></div><span class="ndx-icon-token">⌁</span></div><div class="ndx-chart-controls"><label>Measure<select id="ndx-select">'+metricOptions(false)+'</select></label><label>Compare with<select id="ndx-compare"><option value="">None</option>'+entries.map(function(e){return e.id;}).filter(function(id){return index[id]&&id!==selected&&index[id].unit===index[selected].unit;}).map(function(id){return '<option value="'+esc(id)+'"'+option(id,compare)+'>'+esc(title(index[id]))+'</option>';}).join('')+'</select></label><div class="ndx-horizon" role="group" aria-label="History range"><button data-time="4" aria-pressed="'+(horizon===4)+'">4 periods</button><button data-time="8" aria-pressed="'+(horizon===8)+'">8 periods</button><button data-time="all" aria-pressed="'+(horizon==='all')+'">All</button></div></div><div class="ndx-series-line"><strong>'+esc(title(it.e))+'</strong>'+ (comp?'<span class="ndx-comp-legend">'+esc(title(comp.e))+'</span>':'')+'<span class="ndx-target-legend">Target where available</span></div>'+chartSvg(it,comp,false)+(section==='domestic'?certificationsPane():rhythmPane(it))+'<div class="ndx-chart-callouts"><div><small>Current</small><strong>'+esc(fmt(it.v,(it.a&&it.a.unit)||it.e.unit,true))+'</strong></div><div><small>Movement</small><strong>'+esc(d===null?'—':symbol(d)+' '+num(Math.abs(d),1)+'%')+'</strong></div><div><small>Target attainment</small><strong>'+esc(p===null?'Not comparable':p+'%')+'</strong></div></div><button type="button" class="ndx-text-action" data-inspect="'+esc(selected)+'">Explore '+esc(title(it.e))+' →</button>'+peerPane(it)+'</div>';}
  function attainmentPane(){var rows=cfg.featured.map(item).filter(function(it){return it&&it.target!==null&&it.target>0;});return '<div class="ndx-surface ndx-attainment"><div class="ndx-surface-head"><div><h2>Actual vs target</h2></div></div><div class="ndx-bullet-list">'+(rows.length?rows.map(function(it){var p=percent(it),width=p===null?0:Math.min(100,Math.max(0,p));return '<button class="ndx-bullet'+(it.e.id===selected?' is-active':'')+'" type="button" data-select="'+esc(it.e.id)+'"><span class="ndx-bullet-label"><b>'+esc(title(it.e))+'</b><strong>'+esc(p===null?'—':p+'%')+'</strong></span><span class="ndx-bullet-track"><i style="width:'+width+'%"></i><em></em></span><span class="ndx-bullet-foot">'+esc(fmt(it.v,it.a&&it.a.unit||it.e.unit,true))+' <span> / '+esc(fmt(it.target,it.e.unit,true))+'</span></span></button>';}).join(''):'<div class="ndx-empty"><b>Comparison awaiting verified results</b><p>Reported measurements are needed to calculate attainment.</p></div>')+'</div></div>';}
  function storyGroup(g,idx){var its=g.ids.map(item).filter(function(it){return it&&it.v!==null;}),targetRows=g.ids.map(item).filter(function(it){return it&&it.target!==null;}),planning=its.length===0;var rows=planning?targetRows:its;
    if(!rows.length)return '<div class="ndx-no-group"><p class="ndx-group-caption">'+esc(g.description)+'</p><div class="ndx-empty"><b>Observation pending</b><p>Enter reported measurements to compare contributors.</p></div></div>';
    var unit=rows[0].e.unit,valid=rows.filter(function(it){return it.e.unit===unit&&(planning?it.target!==null:it.v!==null&&(it.a.unit||unit)===unit);}),sum=valid.reduce(function(s,it){return s+(planning?it.target:it.v);},0);
    return '<div class="ndx-flowgroup"><div class="ndx-flowgroup-title"><strong>'+esc(g.name)+'</strong><span>'+esc(planning?'Targets only':'Total · '+fmt(sum,unit,true))+'</span></div><p class="ndx-group-caption">'+esc(g.description)+(planning?' · targets':'')+'</p><div class="ndx-stacked" aria-label="'+esc(g.name)+' contribution bars">'+valid.map(function(it,i){var val=planning?it.target:it.v,share=sum>0?val/sum*100:0;return '<button type="button" data-inspect="'+esc(it.e.id)+'" title="'+esc(title(it.e))+' '+num(share,1)+'%" style="width:'+Math.max(0,share).toFixed(2)+'%;--band:'+['#0E564C','#287C78','#BE8A35','#517A9D','#B66A55','#87A86F'][i%6]+'"></button>';}).join('')+'</div><div class="ndx-composition-list">'+valid.map(function(it,i){var val=planning?it.target:it.v,share=sum?val/sum*100:0;return '<button data-inspect="'+esc(it.e.id)+'" type="button"><span class="ndx-swatch" style="background:'+['#0E564C','#287C78','#BE8A35','#517A9D','#B66A55','#87A86F'][i%6]+'"></span><span>'+esc(title(it.e))+'</span><b>'+esc(fmt(val,unit,true))+'</b><strong>'+num(share,0)+'%</strong></button>';}).join('')+'</div></div>';}
  function compositionPane(){return '<section class="ndx-surface ndx-composition"><div class="ndx-surface-head"><div><h2>Contributions</h2></div></div>'+theme.groups.map(storyGroup).join('')+'</section>';}
  function heatmapPane(){var ids=cfg.featured.filter(function(id){return index[id]&&item(id).target!==null;}),last=[];ids.forEach(function(id){var s=history(item(id));if(s.length>last.length)last=s;});var labels=last.map(function(x){return x.label;});if(labels.length<2)return '<section class="ndx-surface ndx-heat"><div class="ndx-surface-head"><div><p class="ndx-kicker">MOMENTUM</p><h2>By period</h2></div></div><div class="ndx-empty"><b>History awaiting observations</b><p>Add dated observations to generate the period-by-period attainment map.</p></div></section>';
    return '<section class="ndx-surface ndx-heat"><div class="ndx-surface-head"><div><h2>By period</h2></div></div><div class="ndx-heat-scroll"><div class="ndx-heat-grid" style="--periods:'+labels.length+'"><div></div>'+labels.map(function(l){return '<span class="ndx-heat-col">'+esc(l)+'</span>';}).join('')+ids.slice(0,7).map(function(id){var it=item(id),ss=history(it);var cells=labels.map(function(l){var n=ss.findIndex(function(x){return x.label===l;});var val=n>=0?ss[n].value:null,ratio=val!==null&&it.target>0?val/it.target:null;var level=ratio===null?0:ratio>=1?5:Math.max(1,Math.ceil(ratio*5));return '<button type="button" class="ndx-heatcell lv'+level+'" data-heat="'+esc(id)+'" data-heat-label="'+esc(l)+'" title="'+esc(title(it.e)+', '+l+': '+(val===null?'No observation':fmt(val,it.e.unit)+' ('+Math.round(ratio*100)+'% of target)'))+'" aria-label="'+esc(title(it.e)+', '+l)+'">'+(ratio===null?'·':'')+'</button>';}).join('');return '<button class="ndx-heat-name" data-inspect="'+esc(id)+'" type="button">'+esc(title(it.e))+'</button>'+cells;}).join('')+'</div></div><div class="ndx-heat-key">Below plan <i class="lv1"></i><i class="lv2"></i><i class="lv3"></i><i class="lv4"></i><i class="lv5"></i> Target achieved</div></section>';}
  function registerRows(){var matches=entries.map(function(e){return item(e.id);}).filter(function(it){if(search&&[it.e.name,title(it.e),it.e.formula,it.e.rationale,it.e.stream].join(' ').toLowerCase().indexOf(search.toLowerCase())<0)return false;return resultFilter==='all'||status(it)[1]===resultFilter;});
    if(sortBy==='attainment')matches.sort(function(a,b){return (b.ratio===null?-1:b.ratio)-(a.ratio===null?-1:a.ratio);});
    if(sortBy==='name')matches.sort(function(a,b){return title(a.e).localeCompare(title(b.e));});
    if(sortBy==='value')matches.sort(function(a,b){return (b.v===null?-Infinity:b.v)-(a.v===null?-Infinity:a.v);});
    return matches;}
  function registerHTML(){
    var list=registerRows(),size=12,maxPage=Math.max(0,Math.ceil(list.length/size)-1);
    page=Math.min(page,maxPage);
    var cards=list.slice(page*size,page*size+size).map(function(it){
      var p=percent(it),u=(it.a&&it.a.unit)||it.e.unit,actual=fmt(it.v,u,true),target=fmt(it.target,it.e.unit,true),s=status(it);
      var historyBars=smallSpark(it),fill=p===null?0:Math.max(0,Math.min(100,p));
      return '<button type="button" class="ndx-scorecard" data-inspect="'+esc(it.e.id)+'" aria-label="'+esc(tx('Open details')+': '+title(it.e))+'">'
        +'<span class="ndx-scorecard-head"><strong>'+esc(title(it.e))+'</strong><span class="ndx-score-status ndx-'+s[1]+'">'+esc(tx(s[0]))+'</span></span>'
        +'<span class="ndx-score-values"><span><small>'+tx('Actual')+'</small><b>'+esc(actual)+'</b></span><span><small>'+tx('Target')+'</small><b>'+esc(target)+'</b></span></span>'
        +'<span class="ndx-score-bottom"><span class="ndx-score-progress"><i style="width:'+fill+'%"></i></span><b>'+esc(p===null?'—':p+'%')+'</b></span>'
        +'<span class="ndx-score-history">'+historyBars+'<span>'+esc(tx('View details'))+'</span></span>'
        +'</button>';
    }).join('');
    return '<div class="ndx-score-grid" role="list" aria-label="'+tx('Indicator scorecards')+'">'+(cards||'<div class="ndx-score-empty">'+tx('Adjust filters to see results')+'</div>')+'</div>'
      +'<div class="ndx-register-foot"><span>'+tx('Showing')+' '+(list.length?1+page*size:0)+'–'+Math.min(list.length,(page+1)*size)+' '+tx('of')+' '+list.length+'</span><div><button type="button" data-page="prev" '+(page===0?'disabled':'')+'>'+tx('Previous')+'</button><button type="button" data-page="next" '+(page===maxPage?'disabled':'')+'>'+tx('Next')+'</button></div></div>';
  }

  function registerPane(){return '<section class="ndx-surface ndx-register" id="ndx-register"><div class="ndx-register-header"><div><h2>'+tx('Indicator scorecards')+'</h2></div><div class="ndx-register-controls"><label class="ndx-sr" for="ndx-search">Search indicators</label><input id="ndx-search" type="search" placeholder="Search measures…" value="'+esc(search)+'"/><label class="ndx-sr" for="ndx-filter">Filter results</label><select id="ndx-filter"><option value="all"'+option('all',resultFilter)+'>All statuses</option><option value="good"'+option('good',resultFilter)+'>Target achieved</option><option value="steady"'+option('steady',resultFilter)+'>On track</option><option value="caution"'+option('caution',resultFilter)+'>Below plan</option><option value="missing"'+option('missing',resultFilter)+'>Awaiting / review</option><option value="plain"'+option('plain',resultFilter)+'>No target</option></select><select id="ndx-sort" aria-label="Sort results"><option value="framework"'+option('framework',sortBy)+'>Workbook order</option><option value="attainment"'+option('attainment',sortBy)+'>Attainment ↓</option><option value="name"'+option('name',sortBy)+'>Name A–Z</option><option value="value"'+option('value',sortBy)+'>Value ↓</option></select></div></div><div id="ndx-register-body">'+registerHTML()+'</div></section>';}
  function detailsPanel(){if(!detailId)return '';var it=item(detailId);if(!it)return '';var p=percent(it),d=delta(it),h=series(it),point=detailPoint>=0&&detailPoint<h.length?h[detailPoint]:null;var st=status(it);var related=theme.groups.filter(function(g){return g.ids.indexOf(detailId)>=0;}).reduce(function(acc,g){return acc.concat(g.ids);},[]).filter(function(id,i,a){return id!==detailId&&a.indexOf(id)===i;});
    var inner='';
    if(detailTab==='overview')inner='<div class="ndx-detail-highlights"><div><small>Observed</small><strong>'+esc(fmt(it.v,it.a&&it.a.unit||it.e.unit,true))+'</strong></div><div><small>Planned target</small><strong>'+esc(fmt(it.target,it.e.unit,true))+'</strong></div><div><small>Attainment</small><strong>'+esc(p===null?'—':p+'%')+'</strong></div></div><div class="ndx-detail-progress"><i style="width:'+(p===null?0:Math.max(0,Math.min(100,p)))+'%"></i></div><p class="ndx-detail-caption">'+esc(p===null?'Attainment cannot be calculated without a compatible reported value and a target.':fmt(it.v,it.a&&it.a.unit||it.e.unit)+' against a target of '+fmt(it.target,it.e.unit)+(it.illustrativeTarget?' (illustrative target)':''))+'</p><div class="ndx-detail-section"><h4>Performance movement</h4><div class="ndx-detail-movement"><strong>'+esc(d===null?'History pending':symbol(d)+' '+num(Math.abs(d),1)+'%')+'</strong><span>'+esc(d===null?'At least two observations are required.':'Change since the previous observation')+'</span></div><button type="button" class="ndx-text-action" data-detailtab="history">View historical observations →</button></div>'+(related.length?'<div class="ndx-detail-section"><h4>Explore related measures</h4>'+related.map(function(id){var other=item(id);return '<button type="button" class="ndx-related" data-inspect="'+esc(id)+'"><span>'+esc(title(other.e))+'</span><b>'+esc(fmt(other.v,other.a&&other.a.unit||other.e.unit,true))+'</b> ↗</button>';}).join('')+'</div>':'');
    if(detailTab==='history')inner='<div class="ndx-detail-section"><h4>Historical observations</h4>'+chartSvg(it,null,true)+(h.length?'<div class="ndx-history-table"><table><thead><tr><th>Period</th><th>Value</th><th>Movement</th></tr></thead><tbody>'+h.map(function(x,i){var change=i>0&&h[i-1].value!==0?(x.value-h[i-1].value)/Math.abs(h[i-1].value)*100:null;return '<tr class="'+(detailPoint===i?'selected':'')+'"><td><button data-point="'+i+'">'+esc(x.label)+'</button></td><td>'+esc(fmt(x.value,it.a&&it.a.unit||it.e.unit,true))+'</td><td>'+esc(change===null?'—':symbol(change)+' '+num(Math.abs(change),1)+'%')+'</td></tr>';}).join('')+'</tbody></table></div>':'')+'</div>'+(point?'<div class="ndx-period-readout"><p>OBSERVATION DRILL-DOWN</p><h4>'+esc(point.label)+'</h4><strong>'+esc(fmt(point.value,it.a&&it.a.unit||it.e.unit))+'</strong><small>'+esc(it.a&&it.a.source||'Source pending')+'</small><button data-clearpoint type="button">Clear period selection ×</button></div>':'')+'<p class="ndx-detail-caption">'+(mode==='demo'?'Example quarterly observations are fictional.':'Periods are displayed exactly as supplied in the verified data file.')+'</p>';
    if(detailTab==='history'&&view==='annual'&&point){var quarters=rawHistory(it.a).filter(function(r){return matchesPeriod(r).y===point.label;});
      inner+='<section class="ndx-detail-section"><h4>'+tx('Quarterly breakdown')+' · '+point.label+'</h4><p class="ndx-sub">'+tx('Open a quarter to inspect its individual observation.')+'</p>'+quarters.map(function(r){return '<button type="button" class="ndx-related" data-raw-period="'+esc(r.label)+'"><span>'+esc(labelPeriod(r.label))+'</span><b>'+esc(fmt(r.value,it.a&&it.a.unit||it.e.unit,true))+'</b></button>';}).join('')+(detailRawPoint?'<div class="ndx-period-readout"><p>'+tx('QUARTER DETAIL')+'</p><h4>'+esc(labelPeriod(detailRawPoint))+'</h4><strong>'+esc(fmt((quarters.find(function(r){return r.label===detailRawPoint;})||{}).value,it.a&&it.a.unit||it.e.unit))+'</strong></div>':'')+'</section>';}
    return '<div class="ndx-drawer-cover" data-close="1"></div><aside class="ndx-drawer" role="dialog" aria-modal="true" aria-label="Performance details: '+esc(title(it.e))+'"><header class="ndx-drawer-header"><button type="button" class="ndx-back" data-close="1">← Back to dashboard</button><button type="button" class="ndx-close" data-close="1" aria-label="Close details">×</button></header><div class="ndx-drawer-content"><p class="ndx-kicker">'+esc(theme.eyebrow)+'</p><h2>'+esc(title(it.e))+'</h2>'+badge(it)+'<p class="ndx-drawer-sub">'+esc(it.e.rationale||'Explore the reported results, trends and target for this measure.')+'</p><div class="ndx-drawer-tabs" role="tablist" aria-label="Measure detail"><button data-detailtab="overview" aria-selected="'+(detailTab==='overview')+'">Overview</button><button data-detailtab="history" aria-selected="'+(detailTab==='history')+'">History</button></div>'+inner+'<div class="ndx-drawer-note">'+(mode==='demo'?'Illustrative values are not real Ndugu reporting.':'Only supplied, documented observations are displayed.')+'</div></div></aside>';
  }
  function renderDrawer(){var e=root.querySelector('#ndx-detail-root');if(e)e.innerHTML=detailsPanel();document.body.classList.toggle('ndx-drawer-open',!!detailId);if(e)localizeDom(e);}
  function inspect(id,tab){if(!index[id])return;detailId=id;detailTab=tab||'overview';detailPoint=-1;detailRawPoint='';renderDrawer();var c=root.querySelector('.ndx-close');if(c)c.focus();}
  function updateSelection(){var it=item(selected);if(!it)return;var el=root.querySelector('#ndx-main-analysis');if(el)el.innerHTML=chartPane()+attainmentPane();var heat=root.querySelector('#ndx-momentum');if(heat)heat.innerHTML=heatmapPane();if(el)localizeDom(el);if(heat)localizeDom(heat);}
  function updateTable(){var el=root.querySelector('#ndx-register-body');if(el)el.innerHTML=registerHTML();if(el)localizeDom(el);}
  function renderOverview(){if(!root)return;
    if(compare&&(!index[compare]||index[compare].unit!==index[selected].unit||compare===selected))compare='';
    var middle=section==='production'?'<div class="ndx-story-layout ndx-story-reverse"><div id="ndx-momentum">'+heatmapPane()+'</div>'+compositionPane()+'</div>':'<div class="ndx-story-layout">'+compositionPane()+'<div id="ndx-momentum">'+heatmapPane()+'</div></div>';
    root.innerHTML='<div class="ndx-app ndx-'+section+'"><div class="ndx-heading"><h1>'+esc(theme.title)+'</h1><div class="ndx-head-actions">'+pillToggle()+'<button type="button" class="ndx-export" data-export="all">'+tx('Export CSV')+'</button></div></div>'
      +toolbar()+'<div class="ndx-summary">'+priority.map(topCard).join('')+'</div>'
      +'<div class="ndx-main-analysis" id="ndx-main-analysis">'+chartPane()+attainmentPane()+'</div>'
      +middle+registerPane()+'<p class="ndx-source-foot">'+(mode==='demo'?tx('Illustrative preview · not reported results'):tx('Reported observations only'))+'</p><div id="ndx-detail-root"></div></div>';
    renderDrawer();localizeDom(root);tabs.forEach(function(b){var en=b.dataset.ndgTab==='kpi'?'Performance dashboard':section==='production'?'Programme details':'Operations analytics';b.textContent=tx(en);});document.documentElement.lang=lang;
  }

  function csvCell(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"';}
  function exportCSV(only){var set=only?[item(only).e]:entries,rows=set.map(function(e){var it=item(e.id),u=it.a&&it.a.unit||e.unit,monetary=u==='UGX'||u==='USD';return [mode==='demo'?'ILLUSTRATIVE - NOT ACTUAL':'REPORTED DATA',e.id,title(e),it.v===null?'':display(it.v,u),displayUnit(u),it.target===null?'':display(it.target,e.unit),it.illustrativeTarget?'EXAMPLE TARGET':'WORKBOOK TARGET',percent(it)===null?'':percent(it),it.a&&it.a.source||'',it.a&&it.a.as_of||'',e.cell,view,year,view==='annual'?'':quarter,monetary?FX_RATE:''];});
    var csv='\ufeff'+[['Data mode','ID','Measure','Displayed value','Display unit','Displayed target','Target origin','Attainment %','Source','As of','Workbook cell','Time view','Year','Quarter','Reference UGX per USD']].concat(rows).map(function(row){return row.map(csvCell).join(',');}).join('\r\n'),a=document.createElement('a'),url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.href=url;a.download='ndugu-'+section+'-'+view+'-'+year+'-'+currency+'-'+mode+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);}
  root.addEventListener('click',function(ev){var b=ev.target.closest('[data-inspect],[data-select],[data-mode],[data-time],[data-close],[data-detailtab],[data-point],[data-clearpoint],[data-heat],[data-period],[data-page],[data-export],[data-raw-period]');if(!b||!root.contains(b))return;
    if(b.hasAttribute('data-inspect')){inspect(b.getAttribute('data-inspect'));return;}
    if(b.hasAttribute('data-select')){selected=b.dataset.select;compare='';updateSelection();return;}
    if(b.hasAttribute('data-mode')){if(mode!==b.dataset.mode){mode=b.dataset.mode;renderOverview();}return;}
    if(b.hasAttribute('data-time')){horizon=b.dataset.time==='all'?'all':Number(b.dataset.time);updateSelection();return;}
    if(b.hasAttribute('data-close')){detailId='';detailPoint=-1;renderDrawer();return;}
    if(b.hasAttribute('data-detailtab')){detailTab=b.dataset.detailtab;detailPoint=-1;renderDrawer();return;}
    if(b.hasAttribute('data-point')){detailPoint=Number(b.dataset.point);detailRawPoint='';renderDrawer();return;}
    if(b.hasAttribute('data-clearpoint')){detailPoint=-1;detailRawPoint='';renderDrawer();return;}
    if(b.hasAttribute('data-raw-period')){detailRawPoint=b.dataset.rawPeriod;renderDrawer();return;}
    if(b.hasAttribute('data-period')){var it=item(selected),s=history(it),idx=Number(b.dataset.period),ent=s[idx];inspect(selected,'history');var all=series(it);detailPoint=ent?all.findIndex(function(x){return x.label===ent.label;}):-1;renderDrawer();return;}
    if(b.hasAttribute('data-heat')){var it2=item(b.dataset.heat),hh=series(it2);inspect(b.dataset.heat,'history');detailPoint=hh.findIndex(function(x){return x.label===b.dataset.heatLabel;});renderDrawer();return;}
    if(b.hasAttribute('data-page')){page=Math.max(0,page+(b.dataset.page==='next'?1:-1));updateTable();return;}
    if(b.hasAttribute('data-export'))exportCSV(null);
  });
  root.addEventListener('keydown',function(ev){if((ev.key==='Enter'||ev.key===' ')&&ev.target.matches('circle[data-period]')){ev.preventDefault();ev.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}if(ev.key==='Escape'&&detailId){detailId='';renderDrawer();}});
  root.addEventListener('change',function(ev){var id=ev.target.id;if(id==='ndx-select'){selected=ev.target.value;compare='';updateSelection();}else if(id==='ndx-compare'){compare=ev.target.value;updateSelection();}else if(id==='ndx-filter'){resultFilter=ev.target.value;page=0;updateTable();}else if(id==='ndx-sort'){sortBy=ev.target.value;page=0;updateTable();}else if(id==='ndx-view'){changePref('view',ev.target.value);}else if(id==='ndx-year'){changePref('year',ev.target.value);}else if(id==='ndx-quarter'){changePref('quarter',ev.target.value);}else if(id==='ndx-currency'){changePref('currency',ev.target.value);}else if(id==='ndx-fx'){changePref('fxRate',ev.target.value);}});
  root.addEventListener('input',function(ev){if(ev.target.id==='ndx-search'){search=ev.target.value;page=0;updateTable();}});
  function showLegacyError(){var el=document.getElementById('ndg-legacy-error');if(!el)return;el.hidden=false;el.innerHTML='<strong>Operations data unavailable</strong><p>The original operations charts need their existing data.json / export-data.json files. This results dashboard remains available independently.</p>';}
  function select(tab,focus){current=tab==='analytics'?'analytics':'kpi';tabs.forEach(function(b){var on=b.dataset.ndgTab===current;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;if(focus&&on)b.focus();});root.hidden=current!=='kpi';old.hidden=current!=='analytics';if(current==='analytics'){if(!opReady)showLegacyError();else document.getElementById('ndg-legacy-error').hidden=true;window.requestAnimationFrame(function(){window.dispatchEvent(new Event('resize'));});}}
  function setOperationalData(which,payload){if(which!==section||!payload)return;var res={};
    function put(id,val,unit,label){var v=clean(val);if(v===null||v<0)return;res[id]={value:v,unit:unit,source:label,as_of:(payload.kpis&&payload.kpis.date_max)||(payload.meta&&payload.meta.generated)||''};}
    if(section==='domestic'){var k=payload.kpis||{};if(clean(k.total_batch_qty_kg)!==null)put('domestic-8',k.total_batch_qty_kg/1000,'tonnes','Domestic operations · dispatched batches');
      var buyers=Array.isArray(payload.buyers)?payload.buyers:[];
      [['domestic-11',/ugacof/i],['domestic-12',/\betg\b/i]].forEach(function(x){var rows=buyers.filter(function(b){return x[1].test(String(b.buyer||b.name||''))&&clean(b.qty_kg)!==null;});if(rows.length)put(x[0],rows.reduce(function(s,b){return s+Number(b.qty_kg);},0)/1000,'tonnes','Domestic operations · buyer batches');});}
    if(section==='export'){var blocks=payload.seasons||{},key=blocks.all?'all':payload.meta&&payload.meta.default_season,d=blocks[key]||null;
      if(d){var p=d.purchases||{},sales=d.sales||{};
        if(clean(p.net_kg)!==null&&clean(p.graded_kg)!==null)put('export-10',(p.net_kg-p.graded_kg)/1000,'tonnes','Export operations · FAQ intake');
        if(clean(sales.revenue_usd)!==null)put('export-41',sales.revenue_usd,'USD','Export operations · realized sales in USD');
        var sites=Array.isArray(d.by_site)?d.by_site:[];
        [['export-26',/luvule/i],['export-27',/edge/i],['export-28',/darley/i]].forEach(function(x){var rows=sites.filter(function(r){return x[1].test(String(r.site||''))&&clean(r.net_kg)!==null;});if(rows.length)put(x[0],rows.reduce(function(sum,r){return sum+Number(r.net_kg);},0)/1000,'tonnes','Export operations · intake by site');});
        var types=Array.isArray(d.by_type)?d.by_type:[];
        [['export-37',/\brfa\b/i],['export-38',/special/i],['export-39',/fair\s*trade|fairtrade/i]].forEach(function(x){var rows=types.filter(function(r){return x[1].test(String(r.type||''))&&clean(r.volume_kg)!==null;});if(rows.length)put(x[0],rows.reduce(function(sum,r){return sum+Number(r.volume_kg);},0)/1000,'tonnes','Export operations · shipped by certification');});}}
    if(payload.meta&&clean(payload.meta.fx_ugx_per_usd)>100&&clean(payload.meta.fx_ugx_per_usd)<100000&&!savedPrefs.fxRate)FX_RATE=Number(payload.meta.fx_ugx_per_usd);sourceActuals=res;opReady=true;mergeActuals();var el=document.getElementById('ndg-legacy-error');if(el)el.hidden=true;}
  function mergeActuals(){actuals=Object.assign({},sourceActuals,manualActuals);if(root)renderOverview();}
  function setError(){opReady=false;if(current==='analytics')showLegacyError();}
  function loadActuals(){if(location.protocol==='file:')return;fetch('./kpi-actuals.json?v='+Date.now(),{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('not found');return r.json();}).then(function(obj){var res={},vals=(obj.sections||{})[section]||{};
      entries.forEach(function(e){var a=vals[e.id];if(!a)return;var v=clean(a.value);if(v===null||!a.source||!a.as_of)return;res[e.id]={value:v,unit:String(a.unit||e.unit),source:String(a.source),as_of:String(a.as_of)};
        if(Array.isArray(a.history))res[e.id].history=a.history.filter(function(h){return h&&clean(h.value)!==null&&(h.period||h.date||h.label);});});manualActuals=res;mergeActuals();}).catch(function(){});}
  tabs.forEach(function(b){b.addEventListener('click',function(){select(this.dataset.ndgTab);});b.addEventListener('keydown',function(ev){if(['ArrowLeft','ArrowRight','Home','End'].indexOf(ev.key)<0)return;ev.preventDefault();var i=tabs.indexOf(document.activeElement),n=ev.key==='Home'?0:ev.key==='End'?tabs.length-1:(i+(ev.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;select(tabs[n].dataset.ndgTab,true);});});
  // Both legacy header controls and the new dashboard toolbar update the same view.
  document.addEventListener('click',function(ev){var node=ev.target.closest('#langPills [data-lang],#currencyPills [data-currency],#seasonPills [data-season]');if(!node)return;
    if(node.hasAttribute('data-lang')&&lang!==node.dataset.lang)changePref('lang',node.dataset.lang);
    else if(node.hasAttribute('data-currency')&&currency!==node.dataset.currency)changePref('currency',node.dataset.currency);
    else if(node.hasAttribute('data-season')){var y=node.dataset.season;if((y==='all'||/^20\d\d$/.test(y))&&y!==year)changePref('year',y);}
  },true);
  window.addEventListener('ndugu:preferences',function(ev){var p=ev.detail||{};
    if(p.lang&&p.lang!==lang)changePref('lang',p.lang);
    if(p.currency&&p.currency!==currency)changePref('currency',p.currency);
  });
  window.nduguKpiTree={setOperationalData:setOperationalData,setError:setError,select:select};
  document.body.classList.add('ndg-has-tabs');var top=document.getElementById('dashboard');if(top)top.hidden=false;
  var boot=document.getElementById('bootLoading');if(boot)boot.hidden=true;
  renderOverview();select('kpi');loadActuals();
})();
