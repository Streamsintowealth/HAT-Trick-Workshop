import { firebaseConfig } from './firebase-config.js';

// Week 3 source: slides 27–34 of the H.A.T. Trick PowerPoint.
// Actions are participant-facing suggestions, not an answer key.
const CASES = {
  marcus: {
    short: 'Marcus', room: 'ROOM A', title: 'The Messy Payday Rebuild',
    subtitle: 'Prevent rent-money mistakes and hidden leaks.',
    story: 'Marcus uses one checking account and debit card for almost everything. By the 20th, he sometimes spends money needed for rent.',
    facts: [
      ['Monthly take-home', '$3,800'], ['Rent', '$1,550'],
      ['Utilities', '$220'], ['Car payment', '$380']
    ],
    problems: [
      'Groceries, gas, DoorDash and online orders all come from the same account.',
      'Three app subscriptions have been forgotten.',
      'He uses his debit card at unfamiliar gas pumps and online checkouts.'
    ],
    mission: 'Mission: Protect essentials, slow impulse spending, and make a plan for suspicious charges.',
    order: ['h', 'a', 't'],
    steps: {
      h: {
        title: 'HALT', subtitle: 'Pause before spending',
        question: 'Which spending rules should Marcus use before buying a want?',
        hint: 'Pause → Verify → Pay. Select actions that protect his bills before he spends.',
        options: [
          'Check upcoming rent and bills before ordering food or shopping online.',
          'Wait 24 hours before an unplanned purchase over $30.',
          'Set a weekly spending limit and keep bill money off his everyday spending card.'
        ]
      },
      a: {
        title: 'AUDIT', subtitle: 'Build a 3–2–1 safety routine',
        question: 'What should Marcus put into his weekly money check?',
        hint: '3 budget buckets • 2 security protections • 1 weekly review.',
        options: [
          'Compare his real essential bills with his 50/30/20 target, then adjust what does not fit.',
          'Enable transaction alerts and two-factor authentication on his accounts.',
          'Review charges, bank fees and subscriptions for 10 minutes every Sunday.'
        ],
        budget: { needs: '$1,900', wants: '$1,140', future: '$760', note: 'His known fixed bills total $2,150 — already $250 above the needs target, before groceries and gas. The rule is a guide, not a demand.' }
      },
      t: {
        title: 'TAKE ACTION', subtitle: 'Have a card-fraud plan',
        question: 'If Marcus finds a debit-card charge he did not make, which steps should he take?',
        hint: 'Spot → Secure → Report. Act quickly when a transaction looks unauthorized.',
        options: [
          'Lock or freeze the affected card in the banking app, if available.',
          'Contact the bank using its official number to report and dispute the charge immediately.',
          'Follow the bank’s guidance to replace the card, secure affected logins and monitor activity.'
        ]
      }
    },
    finalTitle: 'Why is Marcus losing control of his rent money?',
    finalPrompt: 'Explain how impulse spending and one-account habits are putting his essentials at risk. Which ONE change should Marcus make first, and why?',
    finalPlaceholder: 'We chose this because Marcus is spending from money reserved for… Our first change would be…',
    debrief: 'Marcus: What one change would stop him from spending rent money? Finish with “We chose this because…”'
  },
  elena: {
    short: 'Elena', room: 'ROOM B', title: 'The Breach Rebuild',
    subtitle: 'Respond to fraud first, then rebuild safer habits.',
    story: 'Elena entered her debit-card details on a fake $1.99 package-delivery page. Unauthorized charges appeared, and her rent is due in three days.',
    facts: [
      ['Monthly take-home', '$4,400'], ['Emergency savings in checking', '$6,500'],
      ['Unauthorized debit charges', '$1,400', true], ['Attempted Zelle transfer', '$2,000', true],
      ['Rent due in 3 days', '$1,800']
    ],
    problems: [
      'One checking account is connected to her debit card, online purchases and payment apps.',
      'She has no transaction alerts and reuses the same password for banking and email.',
      'The Zelle transfer was attempted, not confirmed completed. Only her card details are known to have been entered on the fake page.'
    ],
    mission: 'Mission: Stop unauthorized activity, protect rent, and prevent another scam.',
    order: ['t', 'a', 'h'],
    steps: {
      t: {
        title: 'TAKE ACTION', subtitle: 'Respond to the urgent breach first',
        question: 'Which actions should Elena take right away?',
        hint: 'Spot → Secure → Report. Do not wait for the group activity to end in a real fraud emergency.',
        options: [
          'Freeze the debit card and call her bank through its official app or published number.',
          'Report the $1,400 unauthorized charges and attempted $2,000 Zelle transfer; request protection against further activity.',
          'Ask the bank how to protect the $1,800 rent payment; secure affected logins and enable two-factor authentication.'
        ]
      },
      a: {
        title: 'AUDIT', subtitle: 'Rebuild a 3–2–1 safety routine',
        question: 'What should Elena review and improve after contacting the bank?',
        hint: '3 budget buckets • 2 security protections • 1 weekly review.',
        options: [
          'Recheck her 50/30/20 plan and consider separating emergency savings from everyday spending after the bank confirms a safe way.',
          'Turn on transaction alerts and two-factor authentication; stop reusing passwords.',
          'Review transactions for 10 minutes each week and investigate unfamiliar small charges.'
        ],
        budget: { needs: '$2,200', wants: '$1,320', future: '$880', note: 'These are monthly targets, not fixed rules. The existing $6,500 emergency fund is separate from this month’s income plan.' }
      },
      h: {
        title: 'HALT', subtitle: 'Verify before the next payment',
        question: 'Which habits would help Elena avoid another fake-payment request?',
        hint: 'Pause → Verify → Pay. Confirm requests independently before sharing payment details.',
        options: [
          'Do not enter card details through unexpected delivery-fee text links.',
          'Contact the company or person through a known website or phone number before paying.',
          'Check the recipient before using Venmo or Zelle, and never share a one-time security code.'
        ]
      }
    },
    finalTitle: 'Which protection choices put Elena’s money at risk?',
    finalPrompt: 'Explain why her previous account-security choices were unsafe. Which action must come FIRST to help protect her rent payment, and why?',
    finalPlaceholder: 'We chose this first because the urgent risk is… After that, Elena should…',
    debrief: 'Elena: What is her FIRST move to protect the money needed for rent? Finish with “We chose this because…”'
  }
};
const LETTERS = { h: 'H', a: 'A', t: 'T' };
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_RE = /^[A-HJ-NP-Z2-9]{12}$/;
const $ = id => document.getElementById(id);
const configured = Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
const state = { caseId:'marcus', mode:'setup', roomId:null, services:null, user:null, unsubscribe:null,
                values:new Map(), pending:new Map(), debounce:new Map(), noticeTimeout:null, generation:0 };

function esc(value) {
  return String(value).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function toast(text) {
  const el=$('toast'); el.textContent=text; el.classList.add('show');
  clearTimeout(state.noticeTimeout);state.noticeTimeout=setTimeout(()=>el.classList.remove('show'),3200);
}
function showNotice(text,kind='neutral') {
  const el=$('connection-notice');el.className='notice notice-'+kind;el.textContent=text;
}
function setSync(text,kind='') {
  const el=$('sync-status'); el.className='sync-status '+kind;
  const dot=document.createElement('i'); dot.className='dot';el.replaceChildren(dot,document.createTextNode(text));
}
function normalizeCase(id) {return CASES[id] ? id : 'marcus';}
function chosenCaseFromUrl() {return normalizeCase(new URLSearchParams(location.search).get('case'));}
function getRoomFromUrl() {const room=(new URLSearchParams(location.search).get('room')||'').toUpperCase();return ROOM_RE.test(room)?room:null;}
function pickCase(id) {
  state.caseId=normalizeCase(id);
  document.querySelectorAll('[data-pick-case]').forEach(btn=>{
    const active=btn.dataset.pickCase===state.caseId;
    btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));
  });
  if(state.mode!=='setup') { renderCase();updateUrl(); }
}
function updateUrl() {
  const url=new URL(location.href);url.search='';
  if(state.mode==='live'&&state.roomId)url.searchParams.set('room',state.roomId);
  if(state.mode!=='setup')url.searchParams.set('case',state.caseId);
  history.replaceState(null,'',url.pathname+url.search+url.hash);
}
function randomRoomCode() {
  const a=new Uint32Array(12);crypto.getRandomValues(a);
  return [...a].map(n=>ALPHABET[n%ALPHABET.length]).join('');
}
function fieldId(caseId,letter,suffix) { return `${caseId}_${letter}_${suffix}`; }
function currentValue(key) {return state.values.has(key)?state.values.get(key):null;}
function savePreview() {
  try {localStorage.setItem('hat_trick_preview_v1', JSON.stringify(Object.fromEntries(state.values)));} catch (_) {}
}
function loadPreview() {
  let obj={};try {obj=JSON.parse(localStorage.getItem('hat_trick_preview_v1')||'{}');}catch(_){}
  state.values=new Map(Object.entries(obj).filter(([k,v])=>/^(marcus|elena)_(h|a|t)_(opt[0-2]|other|otherText)$|^(marcus|elena)_final$/.test(k)&& (typeof v==='boolean'||typeof v==='string')));
}
function cancelListeners() {
  if(state.unsubscribe) {state.unsubscribe();state.unsubscribe=null;}
  // Attempt to save pending values for an existing room before switching away.
  for(const [key,timer] of state.debounce) {clearTimeout(timer);const pending=state.pending.get(key);if(pending&&state.mode==='live')writeToFirestore(key,pending.value,pending.generation);}
  state.debounce.clear();
}
function showWorksheet() {
  $('setup-screen').hidden=true;$('worksheet-screen').hidden=false;
  $('room-controls').hidden=state.mode!=='live';
  $('room-code').textContent=state.roomId||'—';
  setSync(state.mode==='preview'?'Preview • saved only here':'Connecting…',state.mode==='preview'?'':'');
  renderCase();updateUrl();window.scrollTo({top:0,behavior:'instant'});
}
function renderCase() {
  const c=CASES[state.caseId];
  $('challenge-kicker').textContent=c.room+' • '+c.short.toUpperCase();
  $('challenge-title').textContent=c.title;$('challenge-subtitle').textContent=c.subtitle;
  $('story-title').textContent=c.short+'’s situation';$('story-count').textContent=c.room;
  $('story-summary').textContent=c.story;
  $('story-facts').innerHTML=c.facts.map(([label,number,isAlert])=>`<div class="fact"><small>${esc(label)}</small><b class="${isAlert?'alert-text':''}">${esc(number)}</b></div>`).join('');
  $('story-problem').innerHTML='<b>What is going wrong?</b><ul>'+c.problems.map(s=>`<li>${esc(s)}</li>`).join('')+'</ul>';
  $('story-mission').textContent=c.mission;
  const links=c.order.map(letter=>`<a href="#step-${letter}">${LETTERS[letter]} — ${esc(c.steps[letter].title)}</a>`).join('');
  $('step-links').innerHTML=links+'<a href="#final-card">Our reason ↓</a>';
  $('hat-sections').innerHTML=c.order.map((letter,i)=>renderStep(c,letter,i)).join('');
  $('final-title').textContent=c.finalTitle;$('final-prompt').textContent=c.finalPrompt;
  $('final-reason').placeholder=c.finalPlaceholder;
  $('final-reason').dataset.field=state.caseId+'_final';
  $('debrief-question').textContent=c.debrief;
  applyValuesToView();
}
function renderStep(c,letter,index) {
  const st=c.steps[letter],root=fieldId(state.caseId,letter,'');
  const choices=st.options.map((action,i)=>{
    const id=root+'opt'+i;
    return `<label class="choice"><input type="checkbox" data-field="${id}" aria-label="${esc(action)}"><span>${esc(action)}</span></label>`;
  }).join('');
  const otherKey=root+'other';
  const other=`<label class="choice"><input type="checkbox" data-field="${otherKey}" aria-label="Other action"><span><b>Other</b> — our group has another idea</span></label>
    <div class="other-entry" data-other-box="${otherKey}" hidden><label class="field-label" for="other-${letter}">Type your group’s idea</label><textarea id="other-${letter}" rows="2" maxlength="800" data-field="${root+'otherText'}" placeholder="Our group suggests…"></textarea></div>`;
  const budget=st.budget?`<div class="budget-guide"><strong>50 / 30 / 20 starting point</strong><div class="budget-grid"><div><small>Needs</small><b>${esc(st.budget.needs)}</b></div><div><small>Wants</small><b>${esc(st.budget.wants)}</b></div><div><small>Savings / extra debt</small><b>${esc(st.budget.future)}</b></div></div><p>${esc(st.budget.note)}</p></div>`:'';
  return `<section id="step-${letter}" class="hat-section ${esc(state.caseId)}" aria-labelledby="heading-${letter}"><div class="hat-section-header"><span class="hat-letter">${LETTERS[letter]}</span><div><h3 id="heading-${letter}">${esc(st.title)}</h3><p>${esc(st.subtitle)}</p></div></div><div class="hat-body"><p class="hat-question">${index+1}. ${esc(st.question)}</p><p class="hat-hint">${esc(st.hint)}</p><div class="choices">${choices}${other}</div>${budget}<div class="hint-row">✓ Select as many choices as your group agrees with.</div></div></section>`;
}
function applyValuesToView() {
  document.querySelectorAll('[data-field]').forEach(el=>{
    const key=el.dataset.field;
    if(!key)return;
    const val=currentValue(key);
    if(el.type==='checkbox') {
      el.checked=val===true;
      el.closest('.choice')?.classList.toggle('checked',el.checked);
    } else if(document.activeElement!==el && !state.pending.has(key)) {
      el.value=typeof val==='string'?val:'';
    }
  });
  document.querySelectorAll('[data-other-box]').forEach(box=>{
    const checked=currentValue(box.dataset.otherBox)===true;
    box.hidden=!checked;
  });
}
function updateOneField(key,value,remote=false) {
  state.values.set(key,value);
  if(state.mode==='preview')savePreview();
  const nodes=document.querySelectorAll('[data-field]');
  for(const el of nodes) {
    if(el.dataset.field!==key)continue;
    if(el.type==='checkbox') {el.checked=value===true;el.closest('.choice')?.classList.toggle('checked',el.checked);}
    else if(document.activeElement!==el && !(remote&&state.pending.has(key))) el.value=typeof value==='string'?value:'';
  }
  const otherBox=document.querySelector(`[data-other-box="${key}"]`);
  if(otherBox)otherBox.hidden!==undefined&&(otherBox.hidden=value!==true);
}
function onLocalEdit(key,value,isText) {
  if(state.mode!=='live'&&state.mode!=='preview')return;
  updateOneField(key,value);
  if(state.mode==='preview') {setSync('Preview • saved on this device');return;}
  const gen=state.generation;
  const previous=state.debounce.get(key);if(previous)clearTimeout(previous);
  state.pending.set(key,{value,generation:gen});setSync('Saving to your group…');
  if(isText)state.debounce.set(key,setTimeout(()=>{
    state.debounce.delete(key);writeToFirestore(key,value,gen);
  },550));
  else writeToFirestore(key,value,gen);
}
async function writeToFirestore(key,value,generation) {
  if(state.mode!=='live'||!state.services||generation!==state.generation)return;
  const {db,firestore}=state.services;
  try {
    await firestore.setDoc(firestore.doc(db,'hatRooms',state.roomId,'fields',key),{
      value,updatedBy:state.user.uid,updatedAt:firestore.serverTimestamp()
    });
    if(generation===state.generation){
      const current=state.pending.get(key);if(current&&current.value===value)state.pending.delete(key);
      if(state.pending.size===0)setSync('Live • your group can see changes','live');
    }
  } catch(err) {
    if(generation===state.generation){
      setSync('Save failed • check connection','error');
      toast('Could not save changes. Check internet or Firebase permissions.');
      console.error('Firestore write failed',err);
    }
  }
}
async function connectFirebase() {
  if(!configured){
    showNotice('Preview works now. To enable live groups, connect your own free Firebase project using the included setup guide.','warn');
    $('create-room').disabled=true;$('join-room').disabled=true;
    return false;
  }
  try {
    showNotice('Connecting to the workshop database…','neutral');
    const [appModule, authModule, firestore]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js')
    ]);
    const app=appModule.initializeApp(firebaseConfig);
    const auth=authModule.getAuth(app);
    const result=await authModule.signInAnonymously(auth);
    state.user=result.user;state.services={db:firestore.getFirestore(app),firestore};
    showNotice('Live group editing is ready. Create a room or join with a code.','good');
    $('create-room').disabled=false;$('join-room').disabled=false;
    return true;
  } catch(err) {
    console.error('Firebase connection failed',err);
    showNotice('Could not connect Firebase. Verify your config, Anonymous Authentication, Firestore rules, and internet connection. Preview still works.','error');
    $('create-room').disabled=true;$('join-room').disabled=true;
    return false;
  }
}
async function createRoom() {
  if(!state.services){toast('Connect Firebase first. See the setup guide.');return;}
  $('create-room').disabled=true;
  try {
    const {db,firestore}=state.services;
    const code=randomRoomCode();
    await firestore.setDoc(firestore.doc(db,'hatRooms',code),{
      createdBy:state.user.uid,createdAt:firestore.serverTimestamp(),version:1
    });
    await enterLiveRoom(code);
    toast('Group room created. Share the link with your team.');
  }catch(err){console.error(err);toast('Room creation failed. Check your Firestore rules and connection.');}
  finally{$('create-room').disabled=false;}
}
async function joinRoom(code) {
  if(!state.services){toast('Connect Firebase first. See the setup guide.');return;}
  const normalized=String(code||'').trim().toUpperCase();
  if(!ROOM_RE.test(normalized)){toast('Enter a valid 12-character group code.');return;}
  try {
    const {db,firestore}=state.services;
    const snap=await firestore.getDoc(firestore.doc(db,'hatRooms',normalized));
    if(!snap.exists()){toast('That room was not found. Check the code.');return;}
    await enterLiveRoom(normalized);
  }catch(err){console.error(err);toast('Could not join the room. Check the code, internet and Firebase rules.');}
}
async function enterLiveRoom(code) {
  cancelListeners();state.generation++;state.pending.clear();state.values=new Map();
  state.mode='live';state.roomId=code;showWorksheet();
  const {db,firestore}=state.services;
  state.unsubscribe=firestore.onSnapshot(firestore.collection(db,'hatRooms',code,'fields'),snapshot=>{
    for(const change of snapshot.docChanges()) {
      if(change.type==='removed')continue;
      const id=change.doc.id,record=change.doc.data();
      if(typeof record.value!=='boolean'&&typeof record.value!=='string')continue;
      state.values.set(id,record.value);
      updateOneField(id,record.value,true);
    }
    if(state.pending.size===0)setSync('Live • your group can see changes','live');
  },err=>{
    console.error('Firestore live listener failed',err);
    setSync('Live sync unavailable','error');toast('Live updates are unavailable. Check Firebase rules and connection.');
  });
}
function enterPreview() {
  cancelListeners();state.generation++;state.pending.clear();state.mode='preview';state.roomId=null;loadPreview();showWorksheet();
  toast('Preview only. Your answers are saved on this device, not shared.');
}
function goHome() {
  cancelListeners();state.generation++;state.pending.clear();state.mode='setup';state.roomId=null;state.values=new Map();
  $('worksheet-screen').hidden=true;$('setup-screen').hidden=false;
  const url=new URL(location.href);url.search='';history.replaceState(null,'',url.pathname);
  window.scrollTo({top:0,behavior:'instant'});
}
async function copyRoomLink() {
  if(state.mode!=='live'||!state.roomId)return;
  const url=new URL(location.href);url.search='';url.hash='';
  url.searchParams.set('room',state.roomId);url.searchParams.set('case',state.caseId);
  try { await navigator.clipboard.writeText(url.toString());toast('Group link copied. Share it in your Zoom breakout chat.'); }
  catch (_) {window.prompt('Copy this group link:',url.toString());}
}
function wireEvents() {
  document.querySelectorAll('[data-pick-case]').forEach(btn=>btn.addEventListener('click',()=>pickCase(btn.dataset.pickCase)));
  $('create-room').addEventListener('click',createRoom);
  $('preview-room').addEventListener('click',enterPreview);
  $('join-room').addEventListener('click',()=>joinRoom($('join-code').value));
  $('join-code').addEventListener('keydown',e=>{if(e.key==='Enter')joinRoom(e.target.value);});
  $('back-home').addEventListener('click',goHome);
  $('copy-link').addEventListener('click',copyRoomLink);
  document.addEventListener('change',event=>{
    const el=event.target;if(!el.matches('#worksheet-screen input[data-field][type="checkbox"]'))return;
    onLocalEdit(el.dataset.field,el.checked,false);
  });
  document.addEventListener('input',event=>{
    const el=event.target;if(!el.matches('#worksheet-screen textarea[data-field]'))return;
    const key=el.dataset.field;if(!key)return;
    onLocalEdit(key,el.value,true);
  });
  document.addEventListener('focusout',event=>{
    const el=event.target;if(!el.matches('#worksheet-screen textarea[data-field]'))return;
    const key=el.dataset.field,timer=state.debounce.get(key);
    if(timer){clearTimeout(timer);state.debounce.delete(key);writeToFirestore(key,el.value,state.generation);}
  });
}
async function init() {
  wireEvents();pickCase(chosenCaseFromUrl());
  $('create-room').disabled=true;$('join-room').disabled=true;
  const ready=await connectFirebase();
  const room=getRoomFromUrl();
  if(room&&ready)await joinRoom(room);
  else if(new URLSearchParams(location.search).has('room')&&!ready)toast('This room link needs Firebase configured by the website owner.');
}
init();
