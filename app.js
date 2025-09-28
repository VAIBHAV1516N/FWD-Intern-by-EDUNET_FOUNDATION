 // ---------- Data & Helpers ----------
    const LS_KEY = 'tasks_v1';
    const form = document.getElementById('taskForm');
    const titleInput = document.getElementById('title');
    const descInput = document.getElementById('desc');
    const dueInput = document.getElementById('due');
    const priorityInput = document.getElementById('priority');
    const taskList = document.getElementById('taskList');
    const progressBar = document.getElementById('progressBar');
    const percentText = document.getElementById('percentText');
    const totalCount = document.getElementById('totalCount');
    const doneCount = document.getElementById('doneCount');
    const activeCount = document.getElementById('activeCount');
    const highCount = document.getElementById('highCount');
    const dueTodayCount = document.getElementById('dueTodayCount');
    const chips = document.querySelectorAll('.chip');

    let tasks = loadTasks();
    let currentFilter = 'all';

    // Initialize with example tasks if none found
    function seedIfEmpty(){
      if(!tasks || tasks.length===0){
        tasks = [
          {id:uid(),title:'Plan week',desc:'Block time for deep work',due: null,priority:'medium',done:false,created:Date.now()},
          {id:uid(),title:'Buy groceries',desc:'Milk, eggs, greens',due: null,priority:'low',done:false,created:Date.now()},
          {id:uid(),title:'Finish report',desc:'Send by EOD',due: new Date().toISOString().slice(0,10),priority:'high',done:false,created:Date.now()}
        ];
        saveTasks();
      }
    }

    function uid(){return Math.random().toString(36).slice(2,9)}
    function loadTasks(){try{return JSON.parse(localStorage.getItem(LS_KEY))||[];}catch(e){return []}}
    function saveTasks(){localStorage.setItem(LS_KEY,JSON.stringify(tasks));}

    // ---------- Rendering ----------
    function renderTasks(){
      taskList.innerHTML='';
      const nowStr = new Date().toISOString().slice(0,10);
      const filtered = tasks.filter(t=>{
        if(currentFilter==='all') return true;
        if(currentFilter==='active') return !t.done;
        if(currentFilter==='completed') return t.done;
        if(currentFilter==='due-today') return t.due === nowStr;
        if(currentFilter==='high') return t.priority==='high' && !t.done;
        return true;
      }).sort((a,b)=>a.done - b.done || (a.priority==='high'? -1:1) - (b.priority==='high'? -1:1) || b.created - a.created);

      filtered.forEach(t=>{
        const li = document.createElement('li'); li.className='task';
        li.innerHTML = `
          <div class="left"><input type="checkbox" ${t.done? 'checked': ''} data-id="${t.id}" class="chk" /></div>
          <div class="info">
            <div class="title">${escapeHtml(t.title)} ${t.done? '<span style="opacity:0.6;font-weight:500">(done)</span>':''}</div>
            ${t.desc? `<div class="desc">${escapeHtml(t.desc)}</div>`: ''}
            <div class="meta-row">
              ${t.due? `<div class="badge">Due: ${t.due}</div>`: ''}
              <div class="badge">Priority: ${t.priority}</div>
              <div class="actions" style="margin-left:auto">
                <button class="icon-btn edit" data-id="${t.id}" title="Edit">✏️</button>
                <button class="icon-btn del" data-id="${t.id}" title="Delete">🗑️</button>
              </div>
            </div>
          </div>`;
        taskList.appendChild(li);
      });

      // attach listeners
      document.querySelectorAll('.chk').forEach(chk=>chk.addEventListener('change', e=>toggleDone(e.target.dataset.id)));
      document.querySelectorAll('.del').forEach(btn=>btn.addEventListener('click', e=>{ deleteTask(e.target.dataset.id); }));
      document.querySelectorAll('.edit').forEach(btn=>btn.addEventListener('click', e=>{ startEdit(e.target.dataset.id); }));

      updateStats();
    }

    function escapeHtml(s){ if(!s) return ''; return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;') }

    // ---------- Actions ----------
    function addTaskFromForm(e){
      e && e.preventDefault();
      const title = titleInput.value.trim();
      if(!title) return titleInput.focus();
      const newTask = {id:uid(),title,desc:descInput.value.trim(),due: dueInput.value||null,priority:priorityInput.value||'medium',done:false,created:Date.now()};
      tasks.unshift(newTask);
      saveTasks(); renderTasks(); form.reset(); titleInput.focus();
    }

    function toggleDone(id){
      const t = tasks.find(x=>x.id===id); if(!t) return; t.done = !t.done; saveTasks(); renderTasks();
    }

    function deleteTask(id){
      if(!confirm('Delete this task?')) return;
      tasks = tasks.filter(x=>x.id!==id); saveTasks(); renderTasks();
    }

    function startEdit(id){
      const t = tasks.find(x=>x.id===id); if(!t) return;
      // populate form and when saved, update
      titleInput.value = t.title; descInput.value = t.desc||''; dueInput.value = t.due||''; priorityInput.value = t.priority||'medium';
      // change add button to 'Save'
      const addBtn = document.getElementById('addBtn'); addBtn.textContent = 'Save changes';
      addBtn.dataset.editing = id;
      titleInput.focus();
    }

    // When form submitted while editing
    function handleFormSubmit(e){
      e.preventDefault();
      const addBtn = document.getElementById('addBtn');
      if(addBtn.dataset.editing){
        const id = addBtn.dataset.editing; const t = tasks.find(x=>x.id===id); if(!t) return;
        t.title = titleInput.value.trim()||t.title; t.desc = descInput.value.trim(); t.due = dueInput.value||null; t.priority = priorityInput.value||'medium';
        delete addBtn.dataset.editing; addBtn.textContent = 'Add task'; saveTasks(); renderTasks(); form.reset(); return;
      }
      addTaskFromForm(e);
    }

    function clearCompleted(){ if(!confirm('Remove all completed tasks?')) return; tasks = tasks.filter(t=>!t.done); saveTasks(); renderTasks(); }
    function resetAll(){ if(!confirm('Reset all tasks (this clears LocalStorage)?')) return; tasks = []; saveTasks(); renderTasks(); }

    // ---------- Filters & Stats ----------
    chips.forEach(c=>c.addEventListener('click', ()=>{ chips.forEach(x=>x.classList.remove('active')); c.classList.add('active'); currentFilter = c.dataset.filter; renderTasks(); }));

    function updateStats(){
      const total = tasks.length;
      const done = tasks.filter(t=>t.done).length;
      const active = total - done;
      const high = tasks.filter(t=>t.priority==='high' && !t.done).length;
      const now = new Date().toISOString().slice(0,10);
      const dueToday = tasks.filter(t=>t.due === now && !t.done).length;
      const pct = total===0?0:Math.round((done/total)*100);
      progressBar.style.width = pct + '%'; percentText.textContent = pct + '%'; totalCount.textContent = total; doneCount.textContent = done; activeCount.textContent = active; highCount.textContent = high; dueTodayCount.textContent = dueToday;
    }

    // ---------- Clock ----------
    function tickClock(){ document.getElementById('clock').textContent = new Date().toLocaleString(); }
    setInterval(tickClock,1000); tickClock();

    // ---------- Keyboard shortcuts ----------
    document.addEventListener('keydown', e=>{
      if(e.key==='/' && document.activeElement.tagName.toLowerCase() !== 'input') { e.preventDefault(); titleInput.focus(); }
      if(e.key==='Escape') { document.getElementById('addBtn').textContent='Add task'; delete document.getElementById('addBtn').dataset.editing; form.reset(); }
      if((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); titleInput.focus(); }
    });

    // ---------- Init ----------
    document.getElementById('clearCompleted').addEventListener('click', clearCompleted);
    document.getElementById('resetAll').addEventListener('click', resetAll);
    form.addEventListener('submit', handleFormSubmit);
    titleInput.addEventListener('keydown', e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); addTaskFromForm(); } });

    seedIfEmpty(); renderTasks();