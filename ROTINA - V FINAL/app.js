
const todayStr=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const fmtBR=s=>{const[y,m,d]=s.split('-');return `${d}/${m}/${y}`};
const weekdayName=s=>{const d=new Date(s+'T00:00:00');return ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.getDay()]};
const daysBetween=(a,b)=>Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/86400000);

function defaultTemplates(){
 return {
  folga:[
   {id:'f1',time:'06:30',title:'☀️ Acordar',detail:'Água, higiene e arrumar a cama'},
   {id:'f2',time:'07:00',title:'🏋️ Cross',detail:'Treino ou mobilidade/caminhada'},
   {id:'f3',time:'08:30',title:'🏠 Casa',detail:'20–30 min de manutenção'},
   {id:'f4',time:'09:30',title:'📖 Concurso',detail:'Teoria + questões'},
   {id:'f5',time:'11:30',title:'🍽️ Almoço',detail:'Pausa sem culpa'},
   {id:'f6',time:'13:30',title:'💻 TI',detail:'Prática, projetos e portfólio'},
   {id:'f7',time:'16:00',title:'📱 Redes sociais',detail:'30–45 min com objetivo definido'},
   {id:'f8',time:'17:00',title:'🏠 Casa / pessoal',detail:'Uma tarefa maior'},
   {id:'f9',time:'20:00',title:'📚 Revisão',detail:'Concurso ou TI'},
   {id:'f10',time:'22:30',title:'🌙 Desacelerar',detail:'Evitar telas'}
  ],
  plantao:[
   {id:'p1',time:'06:00',title:'☀️ Acordar',detail:'Café leve antes do turno'},
   {id:'p2',time:'06:30',title:'🎒 Preparar',detail:'Organizar material e sair'},
   {id:'p3',time:'08:00',title:'🚑 Plantão',detail:'Turno de 24h — foco no trabalho'},
   {id:'p4',time:'20:00',title:'💧 Autocuidado',detail:'Hidratação e descanso quando possível'}
  ]
 };
}

function readStored(key,fallback){try{const value=localStorage.getItem(key);return value===null?fallback:JSON.parse(value)}catch(e){return fallback}}
const storedApp=readStored('rotinaAppData',null);
let settings=(storedApp&&storedApp.settings)||readStored('appSettings',{turno:'Delta',work:1,rest:3,anchor:'',vacStart:'',vacEnd:''});
let templates=(storedApp&&storedApp.templates)||readStored('appTemplates',defaultTemplates());
let overrides=(storedApp&&storedApp.overrides)||readStored('appOverrides',{});
let checks=(storedApp&&storedApp.checks)||readStored('appChecks',{});
let dayExtras=(storedApp&&storedApp.dayExtras)||readStored('appDayExtras',{});
let calYear,calMonth,selectedDate=null;
{const t=new Date();calYear=t.getFullYear();calMonth=t.getMonth();}

function saveAll(){
 try{
  localStorage.setItem('rotinaAppData',JSON.stringify({version:1,settings,templates,overrides,checks,dayExtras}));
  const status=document.getElementById('saveStatus');
  if(status){status.textContent='Salvo neste dispositivo';status.classList.remove('error')}
  return true;
 }catch(e){
  const status=document.getElementById('saveStatus');
  if(status){status.textContent='Não foi possível salvar. Exporte uma cópia.';status.classList.add('error')}
  return false;
 }
}
function exportData(){
 const backup={app:'Minha Rotina',version:1,exportedAt:new Date().toISOString(),settings,templates,overrides,checks,dayExtras};
 const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download=`minha-rotina-${todayStr()}.json`;link.click();URL.revokeObjectURL(url);
 document.getElementById('backupMessage').textContent='Cópia de segurança baixada.';
}
function importData(input){
 const file=input.files&&input.files[0];if(!file)return;
 const reader=new FileReader();
 reader.onload=()=>{try{
  const data=JSON.parse(reader.result);
  if(data.app!=='Minha Rotina'||!data.settings||!data.templates||!data.checks)throw new Error('Arquivo inválido');
  settings=data.settings;templates=data.templates;overrides=data.overrides||{};checks=data.checks||{};dayExtras=data.dayExtras||{};
  const saved=saveAll();fillSettingsForm();renderFeriasBadge();renderHoje();renderEditors();renderCalendar();
  document.getElementById('backupMessage').textContent=saved?'Cópia restaurada com sucesso.':'Dados carregados, mas não foi possível gravá-los neste dispositivo.';
 }catch(e){document.getElementById('backupMessage').textContent='Não foi possível ler esse arquivo. Selecione uma cópia válida do app.';}
 input.value='';};
 reader.readAsText(file);
}
// normaliza um registro de check (aceita formato antigo boolean e o novo {done,time})
function getCheckState(date,taskId){
 if(!checks[date]) checks[date]={};
 const entry=checks[date][taskId];
 if(entry===undefined) return {done:false,time:null};
 if(typeof entry==='boolean') return {done:entry,time:null};
 return entry;
}
function setCheckDone(date,taskId,done){
 if(!checks[date]) checks[date]={};
 const cur=getCheckState(date,taskId);
 checks[date][taskId]={done,time:cur.time};
 saveAll(); renderHoje();
}
function setCheckTime(date,taskId,time){
 if(!checks[date]) checks[date]={};
 const cur=getCheckState(date,taskId);
 checks[date][taskId]={done:cur.done,time};
 saveAll(); renderHoje();
}
function addExtraTask(){
 const time=document.getElementById('ex_time').value;
 const title=document.getElementById('ex_title').value.trim();
 const detail=document.getElementById('ex_detail').value.trim();
 if(!time||!title) return;
 const t=todayStr();
 if(!dayExtras[t]) dayExtras[t]=[];
 dayExtras[t].push({id:'x'+Date.now(),time,title,detail});
 document.getElementById('ex_time').value='';
 document.getElementById('ex_title').value='';
 document.getElementById('ex_detail').value='';
 saveAll(); renderHoje();
}
function removeExtraTask(date,id){
 dayExtras[date]=(dayExtras[date]||[]).filter(x=>x.id!==id);
 saveAll(); renderHoje();
}

function autoType(dateStr){
 if(!settings.anchor) return 'folga';
 const cycle=settings.work+settings.rest;
 let diff=daysBetween(settings.anchor,dateStr);
 diff=((diff%cycle)+cycle)%cycle;
 return diff<settings.work?'plantao':'folga';
}
function dayType(dateStr){ return overrides[dateStr] || autoType(dateStr); }
function isFerias(dateStr){ return settings.vacStart && settings.vacEnd && dateStr>=settings.vacStart && dateStr<=settings.vacEnd; }
function isConfigured(){ return !!settings.anchor; }

function show(id,el){
 document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
 document.getElementById(id).classList.add('active');
 document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
 el.classList.add('active');
 document.querySelectorAll('.tab').forEach(x=>x.removeAttribute('aria-current'));
 el.setAttribute('aria-current','page');
 if(id==='cal') renderCalendar();
 if(id==='rotinas') renderEditors();
 if(id==='ajustes') fillSettingsForm();
}

// ---------- HOJE ----------
function renderHoje(){
 const t=todayStr();
 const type=dayType(t);
 const ferias=isFerias(t);
 document.getElementById('hojeData').textContent=`Hoje — ${weekdayName(t)}, ${fmtBR(t)}`;
 const tb=document.getElementById('hojeTipo');
 tb.className='typeBadge '+type;
 tb.textContent=(type==='plantao'?`🚑 Dia de plantão${settings.turno?' — '+settings.turno:''}`:'🏡 Dia de folga')+(ferias?' · Férias':'');

 const ob=document.getElementById('onboarding');
 ob.innerHTML = isConfigured() ? '' : `<div class="notice"><span>Configure seu ciclo de plantão para a rotina se ajustar sozinha.</span><button class="small" onclick="show('ajustes',document.querySelectorAll('.tab')[3])">Configurar agora</button></div>`;

 const baseTasks=templates[type].map(tk=>({...tk,extra:false}));
 const extraTasks=(dayExtras[t]||[]).map(tk=>({...tk,extra:true}));
 const tasks=[...baseTasks,...extraTasks].sort((a,b)=>{
   const ta=getCheckState(t,a.id).time||a.time, tb=getCheckState(t,b.id).time||b.time;
   return ta.localeCompare(tb);
 });
 if(!checks[t]) checks[t]={};
 document.getElementById('routine').innerHTML=tasks.map(task=>{
  const st=getCheckState(t,task.id);
  const shownTime=st.time||task.time;
  return `
  <div class="row">
   <input class="timeInput" type="time" value="${shownTime}" onchange="setCheckTime('${t}','${task.id}',this.value)">
   <div><div class="task">${escapeHTML(task.title)}${task.extra?'<span class="extraTag">extra de hoje</span>':''}</div>${task.detail?`<div class="detail">${escapeHTML(task.detail)}</div>`:''}</div>
   <div style="display:flex;align-items:center;gap:6px">
    <input class="check" type="checkbox" ${st.done?'checked':''} onchange="setCheckDone('${t}','${task.id}',this.checked)">
    ${task.extra?`<button class="removeX" onclick="removeExtraTask('${t}','${task.id}')">✕</button>`:''}
   </div>
  </div>`;
 }).join('');
 updateProgress(t,tasks);

 // próximos dias
 let strip='';
 for(let i=0;i<5;i++){
  const d=new Date(); d.setDate(d.getDate()+i);
  const ds=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const ty=dayType(ds);
  strip+=`<div class="chip ${ty}"><div>${i===0?'Hoje':weekdayName(ds)}</div><div class="d">${ds.slice(8,10)}/${ds.slice(5,7)}</div><div>${ty==='plantao'?'Plantão':'Folga'}</div></div>`;
 }
 document.getElementById('strip').innerHTML=strip;
}
function updateProgress(date,tasks){
 const n=tasks.filter(t=>getCheckState(date,t.id).done).length;
 const p=tasks.length? Math.round(n/tasks.length*100):0;
 document.getElementById('pct').textContent=p+'%';
 document.getElementById('bar').style.width=p+'%';
}

// ---------- ROTINAS (edição) ----------
function renderEditors(){
 renderEditorList('plantao');
 renderEditorList('folga');
}
function renderEditorList(type){
 const el=document.getElementById(type==='plantao'?'editPlantao':'editFolga');
 const list=[...templates[type]].sort((a,b)=>a.time.localeCompare(b.time));
 el.innerHTML=list.map(task=>`
  <div class="editRow">
   <input type="time" value="${task.time}" onchange="updateTask('${type}','${task.id}','time',this.value)">
   <input type="text" value="${escapeAttr(task.title)}" onchange="updateTask('${type}','${task.id}','title',this.value)">
   <input type="text" value="${escapeAttr(task.detail||'')}" onchange="updateTask('${type}','${task.id}','detail',this.value)">
   <button class="danger small" onclick="removeTask('${type}','${task.id}')">✕</button>
  </div>`).join('') || '<p class="hint">Nenhuma tarefa ainda.</p>';
}
function escapeHTML(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escapeAttr(s){ return escapeHTML(s); }
function updateTask(type,id,field,value){
 const task=templates[type].find(t=>t.id===id);
 if(task){ task[field]=value; saveAll(); renderHoje(); }
}
function removeTask(type,id){
 templates[type]=templates[type].filter(t=>t.id!==id);
 saveAll(); renderEditorList(type); renderHoje();
}
function addTask(type){
 const prefix=type==='plantao'?'np_':'nf_';
 const time=document.getElementById(prefix+'time').value;
 const title=document.getElementById(prefix+'title').value.trim();
 const detail=document.getElementById(prefix+'detail').value.trim();
 if(!time||!title) return;
 templates[type].push({id:type[0]+Date.now(),time,title,detail});
 document.getElementById(prefix+'time').value='';
 document.getElementById(prefix+'title').value='';
 document.getElementById(prefix+'detail').value='';
 saveAll(); renderEditorList(type); renderHoje();
}

// ---------- CALENDÁRIO ----------
function changeMonth(delta){
 calMonth+=delta;
 if(calMonth<0){calMonth=11;calYear--;}
 if(calMonth>11){calMonth=0;calYear++;}
 selectedDate=null;
 document.getElementById('dayPanel').style.display='none';
 renderCalendar();
}
function renderCalendar(){
 const box=document.getElementById('calendar');
 box.innerHTML='';
 document.getElementById('calLabel').textContent=new Date(calYear,calMonth,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
 const first=new Date(calYear,calMonth,1).getDay();
 const days=new Date(calYear,calMonth+1,0).getDate();
 const t=todayStr();
 ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].forEach(x=>box.innerHTML+=`<div style="font-weight:700;padding:4px;font-size:12px">${x}</div>`);
 for(let i=0;i<first;i++) box.innerHTML+='<div class="day empty"></div>';
 for(let d=1;d<=days;d++){
  const s=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const ty=dayType(s);
  let cls='day '+ty;
  if(s===t) cls+=' today';
  if(isFerias(s)) cls+=' ferias';
  if(overrides[s]) cls+=' override';
  box.innerHTML+=`<div class="${cls}" onclick="openDay('${s}')"><strong>${d}</strong>${ty==='plantao'?'Plantão':'Folga'}</div>`;
 }
}
function openDay(dateStr){
 selectedDate=dateStr;
 const panel=document.getElementById('dayPanel');
 panel.style.display='block';
 const ty=dayType(dateStr);
 const auto=autoType(dateStr);
 const isOverride=!!overrides[dateStr];
 const tasks=[...templates[ty]].sort((a,b)=>a.time.localeCompare(b.time));
 panel.innerHTML=`
  <div class="dayHeader">
   <strong>${weekdayName(dateStr)}, ${fmtBR(dateStr)}</strong>
   <span class="typeBadge ${ty}">${ty==='plantao'?'Plantão':'Folga'}</span>
   ${isFerias(dateStr)?'<span class="typeBadge ferias">Férias</span>':''}
  </div>
  <p class="hint">Tipo calculado automaticamente: ${auto==='plantao'?'Plantão':'Folga'}${isOverride?' (substituído manualmente abaixo)':''}</p>
  <div class="form">
   <div class="field"><label class="lbl">Definir manualmente</label>
    <select onchange="setOverride('${dateStr}',this.value)">
     <option value="">Automático</option>
     <option value="plantao" ${overrides[dateStr]==='plantao'?'selected':''}>Forçar plantão</option>
     <option value="folga" ${overrides[dateStr]==='folga'?'selected':''}>Forçar folga</option>
    </select>
   </div>
  </div>
  ${tasks.map(tk=>`<div class="row"><div class="time">${escapeHTML(tk.time)}</div><div><div class="task">${escapeHTML(tk.title)}</div>${tk.detail?`<div class="detail">${escapeHTML(tk.detail)}</div>`:''}</div><div></div></div>`).join('')}
 `;
}
function setOverride(dateStr,val){
 if(val) overrides[dateStr]=val; else delete overrides[dateStr];
 saveAll(); renderCalendar(); openDay(dateStr); renderHoje();
}

// ---------- AJUSTES ----------
function fillSettingsForm(){
 document.getElementById('s_turno').value=settings.turno||'';
 document.getElementById('s_work').value=settings.work;
 document.getElementById('s_rest').value=settings.rest;
 document.getElementById('s_anchor').value=settings.anchor||'';
 document.getElementById('s_vacStart').value=settings.vacStart||'';
 document.getElementById('s_vacEnd').value=settings.vacEnd||'';
}
function applyPreset(w,r){
 document.getElementById('s_work').value=w;
 document.getElementById('s_rest').value=r;
}
function saveSettings(){
 settings.turno=document.getElementById('s_turno').value.trim();
 settings.work=parseInt(document.getElementById('s_work').value)||1;
 settings.rest=parseInt(document.getElementById('s_rest').value)||1;
 settings.anchor=document.getElementById('s_anchor').value;
 settings.vacStart=document.getElementById('s_vacStart').value;
 settings.vacEnd=document.getElementById('s_vacEnd').value;
 saveAll();
 renderFeriasBadge();
 renderHoje();
 renderCalendar();
}
function renderFeriasBadge(){
 const el=document.getElementById('feriasBadge');
 el.textContent = (settings.vacStart&&settings.vacEnd) ? `Férias: ${fmtBR(settings.vacStart)} a ${fmtBR(settings.vacEnd)}` : 'Sem férias definidas';
}

// init
fillSettingsForm();
saveAll();
renderFeriasBadge();
renderHoje();


