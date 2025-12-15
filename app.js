/* app.js — loģika: user, dati, tasks, calendar, timer, tēma, sasniegumi */
/* Visi dati tiek glabāti localStorage zem atslēgām, kas saistītas ar lietotāju (nickname) */

(() => {
  // --- Helpers ---
  const qs = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));
  const LS = localStorage;

  // --- Keys and current user ---
  const KEY_CUR_USER = 'tp_current_user'; // stores {nick}
  function dataKey(nick){ return `tp_data_${nick}` } // store object per user

  // --- Default data structure per user ---
  function defaultData(){
    return {
      points: 0,
      tasks: [],
      events: {}, // dateKey -> [{title,created}]
      achievements: {
        firstTaskDone:false,
        fiveTasksDone:false,
        tenPoints:false,
        threeFocus:false
      },
      focusSessions: 0,
      theme: 'light' // 'light' or 'dark'
    };
  }

  // --- Load / Save for current user ---
  function getCurrentUser(){ try{return JSON.parse(LS.getItem(KEY_CUR_USER))||null}catch(e){return null} }
  function setCurrentUser(obj){ LS.setItem(KEY_CUR_USER, JSON.stringify(obj)) }
  function getData(nick){
    const raw = LS.getItem(dataKey(nick));
    return raw ? JSON.parse(raw) : defaultData();
  }
  function saveData(nick, data){ LS.setItem(dataKey(nick), JSON.stringify(data)) }

  // --- UI update helpers ---
  function showOnlyScreen(id){
    // simple navigation: each page is separate file, but used for dynamic parts as well
  }

  function updatePointsUI(nick){
    const data = getData(nick);
    qsa('.points').forEach(el => el.textContent = data.points || 0);
  }

  // --- THEME ---
  function applyThemeToRoot(theme){
    if(theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }

  // --- AUTH (very simple: only nickname; optional password not stored securely) ---
  function initAuthForms(){
    const form = qs('#login-form');
    if(!form) return;
    form.addEventListener('submit', e=>{
      e.preventDefault();
      const nick = qs('#nick').value.trim() || 'Lietotājs';
      // create default data if absent
      if(!LS.getItem(dataKey(nick))){
        saveData(nick, defaultData());
      }
      setCurrentUser({nick});
      // redirect to profile page after login
      location.href = 'profile.html';
    });

    // quick logout
    const btnLogout = qs('#btn-logout');
    if(btnLogout) btnLogout.addEventListener('click', ()=>{
      LS.removeItem(KEY_CUR_USER);
      location.href = 'index.html';
    });
  }

  // --- TASKS ---
  function renderTasksFor(nick){
    const root = qs('#tasks-list');
    if(!root) return;
    const data = getData(nick);
    root.innerHTML = '';
    data.tasks.forEach((t, idx)=>{
      const div = document.createElement('div'); div.className='task';
      const left = document.createElement('div'); left.className='left';
      const cb = document.createElement('input'); cb.type='checkbox'; cb.checked = !!t.done;
      cb.addEventListener('change', ()=>{
        toggleTask(nick, idx);
      });
      const title = document.createElement('div'); title.className='title'; title.textContent = t.title;
      const meta = document.createElement('div'); meta.className='meta'; meta.textContent = t.due ? ('Termiņš: '+t.due) : '';
      left.appendChild(cb); left.appendChild(title); left.appendChild(meta);
      const actions = document.createElement('div');
      const del = document.createElement('button'); del.className='btn small ghost'; del.textContent='Dzēst';
      del.addEventListener('click', ()=>{ removeTask(nick, idx) });
      actions.appendChild(del);
      div.appendChild(left); div.appendChild(actions);
      root.appendChild(div);
    });
  }

  function addTask(nick, title, due){
    if(!title) return;
    const data = getData(nick);
    data.tasks.unshift({title, due, done:false, created:Date.now()});
    saveData(nick, data);
    renderTasksFor(nick);
  }

  function toggleTask(nick, idx){
    const data = getData(nick);
    if(!data.tasks[idx]) return;
    const t = data.tasks[idx];
    t.done = !t.done;
    // award points when marking done
    if(t.done){
      data.points = (data.points || 0) + 5;
    } else {
      data.points = Math.max(0, (data.points||0) - 5);
    }
    // achievements checks
    checkAchievements(nick, data);
    saveData(nick, data);
    renderTasksFor(nick);
    updatePointsUI(nick);
    renderAchievements(nick);
  }

  function removeTask(nick, idx){
    const data = getData(nick);
    data.tasks.splice(idx,1);
    saveData(nick, data);
    renderTasksFor(nick);
  }

  // --- CALENDAR ---
  function renderCalendar(nick, month, year){
    const root = qs('#calendar-root'); if(!root) return;
    root.innerHTML = '';
    const data = getData(nick);
    const header = document.createElement('div'); header.style.display='flex'; header.style.justifyContent='space-between'; header.style.alignItems='center';
    header.innerHTML = `<h3 style="margin:0">${new Date(year,month).toLocaleString('lv',{month:'long',year:'numeric'})}</h3>`;
    root.appendChild(header);

    const grid = document.createElement('div'); grid.className='calendar-grid';
    const first = new Date(year,month,1);
    let startIdx = (first.getDay()+6)%7;
    const daysInMonth = new Date(year, month+1, 0).getDate();
    for(let i=0;i<startIdx;i++){ const b=document.createElement('div'); b.className='day'; grid.appendChild(b); }
    for(let d=1; d<=daysInMonth; d++){
      const dateKey = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const day = document.createElement('div'); day.className='day';
      day.innerHTML = `<div class="date-num">${d}</div>`;
      if(data.events[dateKey] && data.events[dateKey].length) day.classList.add('has-event');
      day.addEventListener('click', ()=> openEventModal(nick, dateKey));
      grid.appendChild(day);
    }
    root.appendChild(grid);
  }

  function openEventModal(nick, dateKey){
    let m = qs('#modal');
    if(!m){
      m = document.createElement('div'); m.id='modal'; m.style.position='fixed'; m.style.inset=0; m.style.display='flex'; m.style.alignItems='center'; m.style.justifyContent='center'; m.style.background='rgba(0,0,0,0.45)'; m.style.zIndex=9999;
      m.innerHTML = `<div style="background:var(--card);padding:14px;border-radius:10px;min-width:280px">
        <h4 id="modal-title" style="margin:0 0 10px 0">Pievienot notikumu</h4>
        <form id="event-form">
          <input id="event-title" class="input" placeholder="Notikuma nosaukums" required>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
            <button type="button" id="ev-cancel" class="btn ghost">Atcelt</button>
            <button type="submit" class="btn">Saglabāt</button>
          </div>
        </form>
      </div>`;
      document.body.appendChild(m);
      qs('#ev-cancel').addEventListener('click', ()=> m.remove());
      qs('#event-form').addEventListener('submit', e=>{
        e.preventDefault();
        const title = qs('#event-title').value.trim();
        if(!title) return;
        const key = m.dataset.key;
        const data = getData(nick);
        if(!data.events[key]) data.events[key]=[];
        data.events[key].push({title, created:Date.now()});
        saveData(nick, data);
        m.remove();
        // re-render current calendar (if present)
        const calRoot = qs('#calendar-root'); if(calRoot) initCalendar(nick);
      });
    }
    m.dataset.key = dateKey;
    qs('#modal-title').textContent = `Pievienot notikumu: ${dateKey}`;
    qs('#event-title').value = '';
    document.body.appendChild(m);
  }

  // --- TIMER (Pomodoro-like) ---
  function initTimerFor(nick){
    const root = qs('#timer-root'); if(!root) return;
    const display = qs('#time-display');
    const startBtn = qs('#timer-start');
    const pauseBtn = qs('#timer-pause');
    const resetBtn = qs('#timer-reset');
    let total = 25*60; // seconds
    let left = total; let timerId = null; let running=false;

    function fmt(s){ const m=Math.floor(s/60); const sec=s%60; return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`; }
    function update(){ if(display) display.textContent = fmt(left); }
    update();

    startBtn?.addEventListener('click', ()=>{
      if(running) return;
      running=true;
      timerId = setInterval(()=>{
        left--; if(left<=0){ clearInterval(timerId); running=false; left=total; onTimerEnd(nick) }
        update();
      },1000);
    });
    pauseBtn?.addEventListener('click', ()=>{ if(timerId) clearInterval(timerId); running=false; });
    resetBtn?.addEventListener('click', ()=>{ if(timerId) clearInterval(timerId); running=false; left=total; update(); });

    function onTimerEnd(nick){
      const data = getData(nick);
      data.points = (data.points || 0) + 10;
      data.focusSessions = (data.focusSessions || 0) + 1;
      // check achievements
      checkAchievements(nick, data);
      saveData(nick, data);
      updatePointsUI(nick);
      renderAchievements(nick);
      alert('Fokusa sesija pabeigta! +10 punkti');
    }
  }

  // --- Achievements logic ---
  function checkAchievements(nick, data){
    // first task done
    if(!data.achievements.firstTaskDone){
      if(data.tasks.some(t=>t.done)) data.achievements.firstTaskDone = true;
    }
    // five tasks done (total completed tasks >=5)
    const doneCount = data.tasks.filter(t=>t.done).length;
    if(!data.achievements.fiveTasksDone && doneCount >= 5) data.achievements.fiveTasksDone = true;
    // ten points
    if(!data.achievements.tenPoints && (data.points || 0) >= 10) data.achievements.tenPoints = true;
    // three focus sessions
    if(!data.achievements.threeFocus && (data.focusSessions || 0) >= 3) data.achievements.threeFocus = true;
  }

  function renderAchievements(nick){
    const root = qs('#ach-list'); if(!root) return;
    const data = getData(nick);
    const ach = data.achievements || {};
    root.innerHTML = '';
    const list = [
      {key:'firstTaskDone', title:'Pirmā izpildītā uzdevuma sasniegums', desc:'+5 p.'},
      {key:'fiveTasksDone', title:'5 izpildīti uzdevumi', desc:'+25 p.'},
      {key:'tenPoints', title:'10 punktu robeža', desc:'Sasniedz 10 punktus'},
      {key:'threeFocus', title:'3 fokusa sesijas', desc:'+15 p.'}
    ];
    list.forEach(a=>{
      const div = document.createElement('div'); div.className='ach'; if(!ach[a.key]) div.classList.add('locked');
      div.innerHTML = `<strong style="font-size:13px">${a.title}</strong><div class="small">${a.desc}</div>`;
      root.appendChild(div);
    });
  }

  // --- Init functions for each page ---
  function initIndex(){
    // header points
    const cur = getCurrentUser();
    if(cur) updatePointsUI(cur.nick);
    // hook buttons are simple links; also show logged user
    const logged = qs('#logged-user'); if(logged){
      if(cur) logged.textContent = `Sveiki, ${cur.nick}`;
      else logged.textContent = 'Nav pieslēgts';
    }
  }

  function initTasks(){
    const cur = getCurrentUser();
    if(!cur) { alert('Lūdzu pieslēdzies profilā (Profilā ievadi segvārdu)'); location.href='profile.html'; return; }
    renderTasksFor(cur.nick);
    updatePointsUI(cur.nick);
    renderAchievements(cur.nick);

    const form = qs('#task-form');
    form?.addEventListener('submit', e=>{
      e.preventDefault();
      const title = qs('#task-title').value.trim();
      const due = qs('#task-due').value;
      if(!title) return;
      addTask(cur.nick, title, due);
      qs('#task-form').reset();
      updatePointsUI(cur.nick);
      renderAchievements(cur.nick);
    });
  }

  function initCalendar(nick){
    const cur = nick || getCurrentUser();
    if(!cur) { /* no user - show empty calendar to explore */ return; }
    let dt = new Date();
    let month = dt.getMonth(), year = dt.getFullYear();
    renderCalendar(cur.nick, month, year);
    qs('#cal-prev')?.addEventListener('click', ()=>{ month--; if(month<0){month=11;year--} renderCalendar(cur.nick, month, year) });
    qs('#cal-next')?.addEventListener('click', ()=>{ month++; if(month>11){month=0;year++} renderCalendar(cur.nick, month, year) });
  }

  function initFocus(){
    const cur = getCurrentUser();
    if(!cur) { alert('Lūdzu pieslēdzies profilā'); location.href='profile.html'; return; }
    initTimerFor(cur.nick);
    updatePointsUI(cur.nick);
    renderAchievements(cur.nick);
  }

  function initProfile(){
    initAuthForms();
    const cur = getCurrentUser();
    // show author info in profile page if present
    const author = qs('#author-info'); if(author) author.innerHTML = `<strong>Autors:</strong><br>Daniels Mironovs<br>12b klase<br>Rīgas Ostvalda Vidusskola`;
    // login form UI: if logged in, show account controls
    if(cur){
      qs('#login-wrap')?.classList.add('hidden');
      qs('#user-wrap')?.classList.remove('hidden');
      qs('#user-nick') && (qs('#user-nick').textContent = cur.nick);
      // load theme and apply
      const data = getData(cur.nick);
      applyThemeToRoot(data.theme || 'light');
      // show points and achievements
      updatePointsUI(cur.nick);
      renderAchievements(cur.nick);
      // nick change (simple)
      qs('#change-nick')?.addEventListener('click', ()=>{
        const newNick = prompt('Ievadi jaunu segvārdu')?.trim();
        if(!newNick) return;
        // migrate data: copy old data under new key, remove old mapping
        const oldNick = cur.nick;
        const oldData = getData(oldNick);
        saveData(newNick, oldData);
        LS.removeItem(dataKey(oldNick));
        setCurrentUser({nick:newNick});
        location.reload();
      });
    } else {
      qs('#login-wrap')?.classList.remove('hidden');
      qs('#user-wrap')?.classList.add('hidden');
      applyThemeToRoot('light');
    }

    // theme toggle button (works for current user if logged)
    qs('#theme-toggle')?.addEventListener('click', ()=>{
      const cur2 = getCurrentUser();
      if(!cur2){ // toggle root theme anyway and store in a temp var
        const isDark = document.documentElement.classList.contains('dark');
        applyThemeToRoot(isDark ? 'light' : 'dark');
        return;
      }
      const data = getData(cur2.nick);
      data.theme = (data.theme === 'dark') ? 'light' : 'dark';
      saveData(cur2.nick, data);
      applyThemeToRoot(data.theme);
    });

    // reset data button
    qs('#reset-data')?.addEventListener('click', ()=>{
      if(!confirm('Vai tiešām vēlies izdzēst visus datus šim kontam?')) return;
      const cur3 = getCurrentUser();
      if(cur3){ saveData(cur3.nick, defaultData()); location.reload(); }
    });
  }

  // --- Render achievements on pages where needed ---
  window.tp = {
    initIndex, initTasks, initCalendar, initFocus, initProfile,
    getCurrentUser, getData, saveData, dataKey
  };

  function initShop(){
    const cur = getCurrentUser();
    if(!cur) { alert('Lūdzu pieslēdzies profilā'); location.href='profile.html'; return; }
    const root = qs('#shop-list');
    updatePointsUI(cur.nick);

    const effects = [
      {key:'fireworks', title:'🎆 Salūts', cost:50},
      {key:'confetti', title:'🎉 Konfeti', cost:30},
      {key:'stars', title:'✨ Zvaigžņu efekts', cost:20}
    ];

    const data = getData(cur.nick);
    if(!data.purchases) data.purchases = {};
    saveData(cur.nick, data);

    function render(){
      root.innerHTML = '';
      effects.forEach(eff=>{
        const owned = !!data.purchases[eff.key];
        const div = document.createElement('div'); div.className='task';
        const left = document.createElement('div'); left.className='left';
        left.innerHTML = `<div class="title">${eff.title}</div><div class="meta">${eff.cost} punkti</div>`;
        const btn = document.createElement('button');
        btn.className='btn small';
        btn.textContent = owned ? 'Atskaņot' : 'Pirkt';
        btn.addEventListener('click', ()=>{
          if(owned){
            playEffect(eff.key);
          } else {
            if(data.points < eff.cost){ alert('Nepietiek punktu!'); return; }
            if(!confirm(`Vai tiešām pirkt "${eff.title}" par ${eff.cost} punktiem?`)) return;
            data.points -= eff.cost;
            data.purchases[eff.key] = true;
            saveData(cur.nick, data);
            updatePointsUI(cur.nick);
            render();
            playEffect(eff.key);
          }
        });
        div.appendChild(left); div.appendChild(btn);
        root.appendChild(div);
      });
    }

    render();
  }

  // 🎆 Efektu funkcija (vienkārši vizuāli animē HTML canvas vai DOM elementus)
  function playEffect(type){
    if(type === 'confetti') launchConfetti();
    if(type === 'fireworks') launchFireworks();
    if(type === 'stars') launchStars();
  }

  // Konfeti
  function launchConfetti(){
    const colors = ['#ff0','#0f0','#0ff','#f0f','#f00','#fff'];
    for(let i=0;i<100;i++){
      const d = document.createElement('div');
      d.style.position='fixed';
      d.style.left = Math.random()*100+'%';
      d.style.top = '-20px';
      d.style.width='8px'; d.style.height='8px';
      d.style.background = colors[Math.floor(Math.random()*colors.length)];
      d.style.borderRadius='50%';
      d.style.zIndex='9999';
      document.body.appendChild(d);
      const fall = Math.random()*3000+2000;
      d.animate([
        {transform:`translateY(0) rotate(0deg)`},
        {transform:`translateY(${window.innerHeight+50}px) rotate(720deg)`}
      ],{duration:fall,easing:'ease-out'});
      setTimeout(()=>d.remove(), fall);
    }
  }

  // Salūts
  function launchFireworks(){
    for(let i=0;i<5;i++){
      setTimeout(()=>{
        const x = Math.random()*window.innerWidth;
        const y = Math.random()*window.innerHeight*0.5;
        for(let j=0;j<30;j++){
          const p = document.createElement('div');
          p.style.position='fixed';
          p.style.left=x+'px'; p.style.top=y+'px';
          p.style.width='4px'; p.style.height='4px';
          p.style.background=`hsl(${Math.random()*360},100%,60%)`;
          p.style.borderRadius='50%';
          p.style.zIndex='9999';
          document.body.appendChild(p);
          const dx = (Math.random()-0.5)*300;
          const dy = (Math.random()-0.5)*300;
          p.animate([{transform:'translate(0,0)',opacity:1},{transform:`translate(${dx}px,${dy}px)`,opacity:0}],{duration:1200,easing:'ease-out'});
          setTimeout(()=>p.remove(),1200);
        }
      }, i*500);
    }
  }

  // Zvaigžņu efekts
  function launchStars(){
    for(let i=0;i<50;i++){
      const s = document.createElement('div');
      s.style.position='fixed';
      s.style.left=Math.random()*100+'%';
      s.style.top=Math.random()*100+'%';
      s.style.width='2px'; s.style.height='2px';
      s.style.background='#fff';
      s.style.borderRadius='50%';
      s.style.boxShadow='0 0 10px 3px #fff';
      s.style.opacity=0;
      s.style.zIndex=9999;
      document.body.appendChild(s);
      s.animate([{opacity:0},{opacity:1},{opacity:0}],{duration:2000,delay:i*50,iterations:1});
      setTimeout(()=>s.remove(), 2500+i*50);
    }
  }

  // Run page-specific init when DOM ready
  document.addEventListener('DOMContentLoaded', ()=>{
    // common init
    initAuthForms();
    // call page-specific based on body id
    const page = document.body.dataset.page;
    if(page==='index') initIndex();
    if(page==='tasks') initTasks();
    if(page==='calendar') initCalendar();
    if(page==='focus') initFocus();
    if(page==='profile') initProfile();
    if(page==='shop') initShop();
  });

})();