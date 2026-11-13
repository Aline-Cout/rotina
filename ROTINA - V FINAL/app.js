
const todayStr=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const fmtBR=s=>{const[y,m,d]=s.split('-');return `${d}/${m}/${y}`};
const weekdayName=s=>{const d=new Date(s+'T00:00:00');return ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.getDay()]};
const daysBetween=(a,b)=>Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/86400000);

function defaultTemplates(){
 return {
  folga:[
   {id:'f1',time:'07:00',title:'☀️ Começar o dia',detail:'Defina um ritmo que funcione para você'},
   {id:'f2',time:'08:00',title:'🏃 Movimento',detail:'Treino, caminhada ou alongamento'},
   {id:'f3',time:'09:00',title:'🏠 Organizar o espaço',detail:'Uma pequena tarefa de casa'},
   {id:'f4',time:'10:00',title:'🎯 Prioridade do dia',detail:'Avance em uma tarefa importante'},
   {id:'f5',time:'12:00',title:'🍽️ Pausa para almoço',detail:'Descanse e recarregue'},
   {id:'f6',time:'14:00',title:'📚 Aprender algo',detail:'Estudo, leitura ou prática'},
   {id:'f7',time:'16:00',title:'☕ Fazer uma pausa',detail:'Um intervalo longe das telas'},
   {id:'f8',time:'17:00',title:'🧹 Resolver pendências',detail:'Escolha o que cabe no seu dia'},
   {id:'f9',time:'20:00',title:'✅ Revisar o dia',detail:'Anote o que deseja continuar amanhã'},
   {id:'f10',time:'22:00',title:'🌙 Desacelerar',detail:'Prepare-se para descansar'}
  ],
  plantao:[
   {id:'p1',time:'06:00',title:'☀️ Começar o dia',detail:'Organize-se antes do turno'},
   {id:'p2',time:'07:00',title:'🎒 Preparar para o trabalho',detail:'Confira o que precisa levar'},
   {id:'p3',time:'08:00',title:'🧭 Início do turno',detail:'Priorize as tarefas do trabalho'},
   {id:'p4',time:'12:00',title:'💧 Pausa e hidratação',detail:'Faça uma pausa quando puder'}
  ]
 };
}

function readStored(key,fallback){try{const value=localStorage.getItem(key);return value===null?fallback:JSON.parse(value)}catch(e){return fallback}}
const storedApp=readStored('rotinaAppData',null);
const hasLegacyStandaloneData=['appSettings','appTemplates','appOverrides','appChecks','appDayExtras'].some(key=>localStorage.getItem(key)!==null);
let settings=(storedApp&&storedApp.settings)||readStored('appSettings',{turno:'Delta',work:1,rest:3,anchor:'',vacStart:'',vacEnd:''});
let templates=(storedApp&&storedApp.templates)||readStored('appTemplates',defaultTemplates());
let overrides=(storedApp&&storedApp.overrides)||readStored('appOverrides',{});
let checks=(storedApp&&storedApp.checks)||readStored('appChecks',{});
let dayExtras=(storedApp&&storedApp.dayExtras)||readStored('appDayExtras',{});
const legacyDataSnapshot=storedApp||(hasLegacyStandaloneData?{version:1,settings,templates,overrides,checks,dayExtras}:null);
let calYear,calMonth,selectedDate=null;
{const t=new Date();calYear=t.getFullYear();calMonth=t.getMonth();}

function appData(){return {version:1,settings,templates,overrides,checks,dayExtras}}
const LEGACY_STORAGE_KEY='rotinaAppData';
const accountStorageKey=uid=>`rotinaAppData:user:${uid}`;
let cloudUser=null,cloudReady=false,cloudUnsubscribe=null,cloudTimer=null,lastCloudJSON='',pendingDataChoice=null,cloudWritePending=false;
function readLocalAppData(key){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):null}catch(e){return null}}
function readDeviceData(uid){return readLocalAppData(accountStorageKey(uid))||readLocalAppData(LEGACY_STORAGE_KEY)||legacyDataSnapshot}
function saveLocalAppData(serialized){if(!cloudUser&&firebaseConfigured())return;localStorage.setItem(cloudUser?accountStorageKey(cloudUser.uid):LEGACY_STORAGE_KEY,serialized)}
function showMainApp(){document.getElementById('dataChoiceScreen').hidden=true;document.getElementById('authScreen').hidden=true;document.getElementById('appShell').hidden=false}
function saveAll(sync=true){
 try{
  const serialized=JSON.stringify(appData());
  saveLocalAppData(serialized);
  const status=document.getElementById('saveStatus');
  if(status){status.textContent=cloudUser?'Salvo neste dispositivo · sincronizando…':'Salvo neste dispositivo';status.classList.remove('error')}
  if(sync&&cloudReady&&cloudUser){clearTimeout(cloudTimer);cloudWritePending=true;cloudTimer=setTimeout(()=>writeCloud(serialized),450)}
  return true;
 }catch(e){
  const status=document.getElementById('saveStatus');
  if(status){status.textContent='Não foi possível salvar. Exporte uma cópia.';status.classList.add('error')}
  return false;
 }
}
function applyAppData(data){
 if(!data)return;
 settings=data.settings||settings;templates=data.templates||templates;overrides=data.overrides||{};checks=data.checks||{};dayExtras=data.dayExtras||{};
 saveLocalAppData(JSON.stringify(appData()));
 fillSettingsForm();renderFeriasBadge();renderHoje();renderEditors();renderCalendar();
}
function setSaveMessage(message,error=false){const el=document.getElementById('saveStatus');if(el){el.textContent=message;el.classList.toggle('error',error)}}
function firebaseConfigured(){const c=window.ROUTINA_FIREBASE_CONFIG||{};return !!(c.apiKey&&c.authDomain&&c.projectId&&c.appId&&!c.apiKey.includes('PREENCHER'))}
function setAuthMessage(message,error=false){const el=document.getElementById('authMessage');if(el){el.textContent=message;el.classList.toggle('error',error)}}
function setAuthMode(mode){const signup=mode==='signup';document.getElementById('authTitle').textContent=signup?'Criar conta grátis':'Entrar na minha rotina';document.getElementById('authSubmit').textContent=signup?'Criar conta':'Entrar';document.getElementById('authSwitch').textContent=signup?'Já tenho uma conta · Entrar':'Ainda não tenho conta · Criar conta';document.getElementById('authSwitch').dataset.mode=signup?'login':'signup';document.getElementById('authPassword').autocomplete=signup?'new-password':'current-password';setAuthMessage('')}
async function submitAuth(event){event.preventDefault();if(!window.routineAuth)return;const email=document.getElementById('authEmail').value.trim(),password=document.getElementById('authPassword').value;try{setAuthMessage('Conectando…');if(document.getElementById('authSwitch').dataset.mode==='login')await window.routineAuth.signInWithEmailAndPassword(email,password);else await window.routineAuth.createUserWithEmailAndPassword(email,password)}catch(e){const msgs={ 'auth/invalid-email':'Confira o endereço de e-mail.','auth/user-not-found':'Conta não encontrada. Crie uma conta ou confira o e-mail.','auth/wrong-password':'Senha incorreta.','auth/invalid-credential':'E-mail ou senha inválidos.','auth/email-already-in-use':'Este e-mail já possui conta. Entre nela.','auth/weak-password':'Use uma senha com pelo menos 6 caracteres.','auth/operation-not-allowed':'Ative E-mail/senha na configuração de autenticação do Firebase.'};setAuthMessage(msgs[e.code]||'Não foi possível entrar. Confira sua conexão e a configuração Firebase.',true)}}
async function resetPassword(){const email=document.getElementById('authEmail').value.trim();if(!email){setAuthMessage('Informe seu e-mail para receber o link de redefinição.',true);return}try{await window.routineAuth.sendPasswordResetEmail(email);setAuthMessage('Enviamos um link para redefinir sua senha.')}catch(e){setAuthMessage('Não foi possível enviar o link. Confira o e-mail e a configuração Firebase.',true)}}
async function signOutUser(){if(window.routineAuth)await window.routineAuth.signOut()}
async function writeCloud(serialized){if(!cloudReady||!cloudUser)return;try{setSaveMessage('Sincronizando…');await window.routineDoc(cloudUser.uid).set(JSON.parse(serialized));lastCloudJSON=serialized;cloudWritePending=false;setSaveMessage('Sincronizado com sua conta')}catch(e){cloudWritePending=false;setSaveMessage('Sem conexão · dados salvos neste dispositivo',true)}}
function showDataChoice(deviceData,cloudData){
 pendingDataChoice={deviceData,cloudData};
 document.getElementById('authScreen').hidden=true;document.getElementById('appShell').hidden=true;document.getElementById('dataChoiceScreen').hidden=false;
 const hasCloud=!!cloudData,account=cloudUser?.email||'esta conta';
 document.getElementById('dataChoiceTitle').textContent=hasCloud?'Qual cópia deseja manter?':'Há dados neste aparelho';
 document.getElementById('dataChoiceText').textContent=hasCloud
  ?`Encontramos uma cópia local diferente dos dados da nuvem de ${account}. Escolher a cópia deste aparelho substituirá os dados que estão na nuvem.`
  :`Encontramos dados antigos neste navegador. Eles só serão enviados para a conta ${account} se você escolher importar.`;
 document.getElementById('useDeviceData').hidden=!deviceData;
 document.getElementById('useCloudData').hidden=!hasCloud;
 document.getElementById('startEmptyData').hidden=hasCloud;
}
function freshAppData(){settings={turno:'',work:1,rest:1,anchor:'',vacStart:'',vacEnd:''};templates=defaultTemplates();overrides={};checks={};dayExtras={};return appData()}
async function resolveDataChoice(choice){
 if(!pendingDataChoice||!cloudUser)return;
 let data;
 if(choice==='device')data=pendingDataChoice.deviceData;
 else if(choice==='cloud')data=pendingDataChoice.cloudData;
 else data=freshAppData();
 pendingDataChoice=null;applyAppData(data);lastCloudJSON=JSON.stringify(appData());cloudReady=true;showMainApp();
 if(choice==='cloud')setSaveMessage('Sincronizado com sua conta');else await writeCloud(lastCloudJSON);
}
function loadCloudUser(user){
 const nextUid=user?.uid||null,previousUid=cloudUser?.uid||null;
 if(nextUid!==previousUid){lastCloudJSON='';cloudWritePending=false}
 cloudUser=user;cloudReady=false;pendingDataChoice=null;
 if(cloudUnsubscribe){cloudUnsubscribe();cloudUnsubscribe=null}
 if(!user){document.getElementById('authScreen').hidden=false;document.getElementById('appShell').hidden=true;document.getElementById('dataChoiceScreen').hidden=true;cloudUser=null;return}
 document.getElementById('accountEmail').textContent=user.email||'Conta';
 const ref=window.routineDoc(user.uid);
 cloudUnsubscribe=ref.onSnapshot(snapshot=>{
  if(pendingDataChoice)return;
  const localData=readDeviceData(user.uid);
  if(snapshot.exists){
   const data=snapshot.data(),serialized=JSON.stringify(data);
   if(cloudReady&&cloudWritePending&&serialized===lastCloudJSON)return;
   const localSerialized=localData?JSON.stringify(localData):'';
   const hasUnsyncedLocal=!!localSerialized&&localSerialized!==lastCloudJSON&&localSerialized!==serialized;
   if(localData&&localSerialized!==serialized&&(!cloudReady||hasUnsyncedLocal)){showDataChoice(localData,data);return}
   if(serialized!==lastCloudJSON){applyAppData(data);lastCloudJSON=serialized}
   cloudReady=true;showMainApp();setSaveMessage('Sincronizado com sua conta');
  }else if(!cloudReady){
   if(localData){showDataChoice(localData,null);return}
   const initial=JSON.stringify(appData());saveLocalAppData(initial);lastCloudJSON=initial;cloudReady=true;showMainApp();writeCloud(initial);
  }
 },()=>{
  const localData=readLocalAppData(accountStorageKey(user.uid));
  if(localData){applyAppData(localData);showMainApp()}else{document.getElementById('authScreen').hidden=true;document.getElementById('appShell').hidden=true;document.getElementById('dataChoiceScreen').hidden=false;document.getElementById('dataChoiceTitle').textContent='Não foi possível conectar';document.getElementById('dataChoiceText').textContent='Confira sua conexão e atualize a página. Os dados locais desta conta foram preservados.';document.getElementById('useDeviceData').hidden=true;document.getElementById('useCloudData').hidden=true;document.getElementById('startEmptyData').hidden=true}
  cloudReady=true;setSaveMessage('Sem conexão · dados salvos neste dispositivo',true);
 });
}
function openDeleteAccountDialog(){
 document.getElementById('deleteAccountPassword').value='';document.getElementById('deleteAccountMessage').textContent='';document.getElementById('deleteAccountDialog').showModal();
}
async function deleteAccountAndData(event){
 event.preventDefault();const user=window.routineAuth?.currentUser;if(!user)return;
 try{
  const password=document.getElementById('deleteAccountPassword').value;
  const credential=firebase.auth.EmailAuthProvider.credential(user.email,password);
  await user.reauthenticateWithCredential(credential);
  await window.routineDoc(user.uid).delete();
  await user.delete();
  localStorage.removeItem(accountStorageKey(user.uid));
  document.getElementById('deleteAccountDialog').close();
 }catch(e){
  const messages={'auth/wrong-password':'Senha incorreta. Confira e tente novamente.','auth/invalid-credential':'Senha incorreta. Confira e tente novamente.','auth/too-many-requests':'Muitas tentativas. Aguarde um pouco e tente novamente.','auth/requires-recent-login':'Não foi possível confirmar a sessão. Saia e entre novamente antes de excluir a conta.'};
  document.getElementById('deleteAccountMessage').textContent=messages[e.code]||'Não foi possível excluir a conta. Confira sua conexão e tente novamente.';
 }
}
function initCloud(){if(!firebaseConfigured()||!window.firebase){document.getElementById('authScreen').hidden=true;document.getElementById('appShell').hidden=false;setSaveMessage('Salvo neste dispositivo');return}try{firebase.initializeApp(window.ROUTINA_FIREBASE_CONFIG);window.routineAuth=firebase.auth();const db=firebase.firestore();window.routineDoc=uid=>db.collection('users').doc(uid).collection('appData').doc('main');window.routineAuth.onAuthStateChanged(loadCloudUser)}catch(e){document.getElementById('authScreen').hidden=false;document.getElementById('appShell').hidden=true;setAuthMessage('Falha ao iniciar Firebase. Confira firebase-config.js.',true)}}
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
 if(entry===undefined) return {done:false,time:null,status:'todo'};
 if(typeof entry==='boolean') return {done:entry,time:null,status:entry?'done':'todo'};
 const status=entry.status||(entry.done?'done':'todo');
 return {...entry,status,done:status==='done'||!!entry.done};
}
function setCheckDone(date,taskId,done){
 setTaskStatus(date,taskId,done?'done':'todo');
}
function setCheckTime(date,taskId,time){
 if(!checks[date]) checks[date]={};
 const cur=getCheckState(date,taskId);
 checks[date][taskId]={...cur,time};
 saveAll(); renderHoje();
}
function addExtraTask(){
 const time=document.getElementById('newTaskTime').value;
 const title=document.getElementById('newTaskTitle').value.trim();
 const detail=document.getElementById('newTaskDetail').value.trim();
 if(!title) return;
 const t=todayStr();
 if(!dayExtras[t]) dayExtras[t]=[];
 dayExtras[t].push({id:'x'+Date.now(),time,title,detail});
 document.getElementById('newTaskForm').reset();
 document.getElementById('taskDialog').close();
 saveAll(); renderHoje();
}
function setTaskStatus(date,taskId,status){
 if(!['todo','doing','done'].includes(status)) return;
 if(!checks[date]) checks[date]={};
 const current=getCheckState(date,taskId);
 checks[date][taskId]={...current,status,done:status==='done',time:current.time};
 saveAll();renderHoje();
}
function dragTask(event,date,taskId){
 event.dataTransfer.effectAllowed='move';
 event.dataTransfer.setData('text/plain',JSON.stringify({date,taskId}));
 event.currentTarget.classList.add('dragging');
}
function allowTaskDrop(event){
 event.preventDefault();
 event.dataTransfer.dropEffect='move';
 event.currentTarget.classList.add('drop-active');
}
function clearDropState(event){event.currentTarget.classList.remove('drop-active')}
function dropTask(event,status){
 event.preventDefault();
 const column=event.currentTarget;
 column.classList.remove('drop-active');
 try{const item=JSON.parse(event.dataTransfer.getData('text/plain'));setTaskStatus(item.date,item.taskId,status)}catch(e){return}
}
function focusNewTask(){
 const dialog=document.getElementById('taskDialog');
 document.getElementById('newTaskTime').value='';
 dialog.showModal();
 document.getElementById('newTaskTitle').focus();
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
 document.querySelectorAll('.nav-link').forEach(x=>x.classList.remove('active'));
 el.classList.add('active');
 document.querySelectorAll('.nav-link').forEach(x=>x.removeAttribute('aria-current'));
 el.setAttribute('aria-current','page');
 const titles={dia:'Visão geral',rotinas:'Quadro de rotinas',cal:'Calendário',ajustes:'Ajustes'};
 document.getElementById('viewTitle').textContent=titles[id]||'Minha Rotina';
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
 document.getElementById('todayLongDate').textContent=new Date(t+'T00:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).toUpperCase();
 const tb=document.getElementById('hojeTipo');
 tb.className='typeBadge '+type;
 tb.textContent=(type==='plantao'?`🚑 Dia de plantão${settings.turno?' — '+settings.turno:''}`:'🏡 Dia de folga')+(ferias?' · Férias':'');

 const ob=document.getElementById('onboarding');
 ob.innerHTML = isConfigured() ? '' : `<div class="notice"><span>Configure seu ciclo de plantão para a rotina se ajustar sozinha.</span><button class="small" onclick="show('ajustes',document.querySelectorAll('.nav-link')[3])">Configurar agora</button></div>`;

 const baseTasks=templates[type].map(tk=>({...tk,extra:false}));
 const extraTasks=(dayExtras[t]||[]).map(tk=>({...tk,extra:true}));
 const tasks=[...baseTasks,...extraTasks].sort((a,b)=>{
   const ta=getCheckState(t,a.id).time||a.time||'', tb=getCheckState(t,b.id).time||b.time||'';
   return ta.localeCompare(tb);
 });
 if(!checks[t]) checks[t]={};
 const columns=[{key:'todo',title:'A fazer',hint:'Na fila'},{key:'doing',title:'Em andamento',hint:'Em foco'},{key:'done',title:'Concluído',hint:'Feito por hoje'}];
 document.getElementById('routine').innerHTML=columns.map(column=>{
  const items=tasks.filter(task=>getCheckState(t,task.id).status===column.key);
  return `<section class="kanban-column ${column.key}-column" ondragover="allowTaskDrop(event)" ondragleave="clearDropState(event)" ondrop="dropTask(event,'${column.key}')"><div class="column-header"><div><span class="column-indicator"></span><h3>${column.title}</h3><span class="column-count">${items.length}</span></div><small>${column.hint}</small></div><div class="task-list">${items.map(task=>renderTaskCard(task,t,column.key)).join('')||`<div class="empty-column">${column.key==='done'?'As tarefas concluídas aparecem aqui.':'Nenhuma tarefa nesta etapa.'}</div>`}</div></section>`;
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
function renderTaskCard(task,date,status){
 const state=getCheckState(date,task.id);
 const shortId=String(task.id).slice(-4).toUpperCase();
 const select=`<select class="task-status-select" aria-label="Status de ${escapeAttr(task.title)}" onchange="setTaskStatus('${date}','${task.id}',this.value)"><option value="todo" ${status==='todo'?'selected':''}>A fazer</option><option value="doing" ${status==='doing'?'selected':''}>Em andamento</option><option value="done" ${status==='done'?'selected':''}>Concluído</option></select>`;
 return `<article class="task-card ${status==='done'?'completed':''}" draggable="true" ondragstart="dragTask(event,'${date}','${task.id}')" ondragend="this.classList.remove('dragging')"><div class="task-card-head"><span class="task-id">${task.extra?'PESSOAL':'ROT'}-${shortId}</span>${select}</div><h4>${escapeHTML(task.title)}</h4>${task.detail?`<p class="task-description">${escapeHTML(task.detail)}</p>`:''}<div class="task-card-foot"><label class="task-time"><span>HORÁRIO</span><input type="time" value="${state.time||task.time}" onchange="setCheckTime('${date}','${task.id}',this.value)" aria-label="Horário de ${escapeAttr(task.title)}"></label>${task.extra?`<button class="remove-task" aria-label="Remover ${escapeAttr(task.title)}" onclick="removeExtraTask('${date}','${task.id}')">×</button>`:`<span class="task-category">${dayType(date)==='plantao'?'Plantão':'Folga'}</span>`}</div></article>`;
}
function updateProgress(date,tasks){
 const states=tasks.map(t=>getCheckState(date,t.id).status);
 const n=states.filter(status=>status==='done').length;
 const doing=states.filter(status=>status==='doing').length;
 const todo=states.filter(status=>status==='todo').length;
 const p=tasks.length? Math.round(n/tasks.length*100):0;
 document.getElementById('pct').textContent=p+'%';
 document.getElementById('bar').style.width=p+'%';
 document.getElementById('doneCount').textContent=n;
 document.getElementById('doingCount').textContent=doing;
 document.getElementById('todoCount').textContent=todo;
 document.getElementById('totalCount').textContent=tasks.length;
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
 ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].forEach(x=>box.innerHTML+=`<div class="weekday">${x}</div>`);
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
setAuthMode('login');
initCloud();


