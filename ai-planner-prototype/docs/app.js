// ===== State =====
const db = JSON.parse(localStorage.getItem('aiPlannerDB2')||'{}');
db.projects ||= [];
db.tasks ||= [];
db.plan ||= {}; // key: day-YYYY-MM-DD -> [taskIds]

function save(){ localStorage.setItem('aiPlannerDB2', JSON.stringify(db)); render(); }

// ===== Tabs =====
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  };
});

// ===== Project form =====
const projectForm = document.getElementById('projectForm');
projectForm.onsubmit = e => {
  e.preventDefault();
  const p = {
    id: crypto.randomUUID(),
    title: document.getElementById('pTitle').value.trim(),
    due: document.getElementById('pDue').value || '',
    priority: document.getElementById('pPriority').value,
    child: document.getElementById('childName').value.trim(),
    age: parseInt(document.getElementById('childAge').value||'10',10),
    level: document.getElementById('level').value,
    subjects: Array.from(document.getElementById('subjects').selectedOptions).map(o=>o.value),
    goal: document.getElementById('pGoal').value.trim()
  };
  if(!p.title) return;
  db.projects.push(p);
  projectForm.reset();
  save();
};

// "AI 建议任务"：使用最近项目的元数据进入确认弹窗
document.getElementById('genTasksBtn').onclick = ()=>{
  if(db.projects.length===0){ alert('请先新建一个项目'); return; }
  const project = db.projects[db.projects.length-1];
  const tasks = aiSuggest(project);
  openAiDialog(tasks, project);
};

function openAiDialog(tasks, project){
  const list = document.getElementById('aiTaskList');
  list.innerHTML = '';
  tasks.forEach((t,i)=>{
    const card = document.createElement('div');
    card.className='card';
    card.innerHTML = `
      <input value="${t.title}" class="t-title">
      <small>可交付物：</small>
      <input value="${t.deliverable}" class="t-deliver">
      <small>时长(分钟)：</small>
      <input type="number" value="${t.minutes}" class="t-min">
      <div class="actions">
        <button data-act="del">删除</button>
      </div>`;
    card.querySelector('[data-act="del"]').onclick = ()=>{ card.remove(); };
    list.appendChild(card);
  });

  const dlg = document.getElementById('aiDialog');
  dlg.showModal();

  document.getElementById('confirmAi').onclick = (e)=>{
    e.preventDefault();
    list.querySelectorAll('.card').forEach(card=>{
      const t = {
        id: crypto.randomUUID(),
        projectId: project.id,
        title: card.querySelector('.t-title').value,
        deliverable: card.querySelector('.t-deliver').value,
        minutes: parseInt(card.querySelector('.t-min').value||'25',10),
        status: 'todo',
        subject: (project.subjects[0]||'通用')
      };
      db.tasks.push(t);
    });
    dlg.close();
    save();
    // 切到任务页
    document.querySelector('.tab-btn[data-tab="tasks"]').click();
  };
}

// ===== AI Suggester (rule-based demo) =====
function aiSuggest(p){
  const S = (name)=>({title:name, deliverable:'完成记录/照片', minutes:25});
  const tasks = [];
  const subj = p.subjects || [];
  const has = s => subj.includes(s);

  if(has('阅读')){
    tasks.push(S('自由阅读 20 分钟'), S('复述要点（口头/书面）'), S('生词卡片 10 个'));
  }
  if(has('英语')){
    tasks.push(S('单词卡 20 个'), S('听写 10 个'), S('口语 1 分钟'));
  }
  if(has('运动')){
    tasks.push(S('热身 + 拉伸'), S('跳绳 5×2 分钟'), S('核心力量 平板 3×30s'));
  }
  if(has('数学') || (!has('阅读') && !has('英语') && !has('运动'))){
    tasks.push(S('二位数加法口算 20 题'), S('减法退位 15 题'), S('乘法口诀复习'));
  }
  // 难度微调
  if(p.level==='高') tasks.push(S('挑战：解决开放题 1 个'));
  if(p.level==='低') tasks.unshift(S('热身：口算加减各 10 题'));

  return tasks.slice(0,8);
}

// ===== Render projects =====
function renderProjects(){
  const wrap = document.getElementById('projectList');
  wrap.innerHTML='';
  db.projects.forEach(p=>{
    const card = document.createElement('div');
    card.className='card';
    card.innerHTML = `
      <strong>${p.title}</strong>
      <div class="tags">
        ${(p.subjects||[]).map(s=>`<span class="tag">${s}</span>`).join('')}
      </div>
      <small>孩子：${p.child||'—'} ｜ 年龄：${p.age||'—'} ｜ 水平：${p.level}</small>
      <small>截止：${p.due||'—'} ｜ 优先：${p.priority}</small>
      <div class="actions">
        <button data-act="gen" data-id="${p.id}">AI 建议任务</button>
        <button class="ghost" data-act="del" data-id="${p.id}">删除</button>
      </div>`;
    wrap.appendChild(card);
  });
  const sel = document.getElementById('filterProject');
  sel.innerHTML = '<option value="all">所有项目</option>' + db.projects.map(p=>`<option value="${p.id}">${p.title}</option>`).join('');
}
document.getElementById('projectList').onclick = (e)=>{
  const id = e.target.dataset.id;
  const act = e.target.dataset.act;
  if(!id || !act) return;
  const p = db.projects.find(x=>x.id===id);
  if(act==='del'){
    if(confirm('确定删除项目及其任务？')){
      db.tasks = db.tasks.filter(t=>t.projectId!==id);
      db.projects = db.projects.filter(x=>x.id!==id);
      save();
    }
  }
  if(act==='gen'){
    openAiDialog(aiSuggest(p), p);
  }
};

// ===== Render tasks & interactions =====
function renderTasks(){
  const wrap = document.getElementById('taskList');
  wrap.innerHTML='';
  const pid = document.getElementById('filterProject').value || 'all';
  const fs = document.getElementById('filterStatus').value || 'all';
  db.tasks
    .filter(t=> pid==='all' || t.projectId===pid)
    .filter(t=> fs==='all' || t.status===fs)
    .forEach(t=> wrap.appendChild(taskCard(t)));
}
function taskCard(t){
  const card = document.createElement('div');
  card.className='card';
  card.draggable = true;
  card.dataset.id = t.id;
  card.innerHTML = `
    <strong>${t.title}</strong>
    <div class="tags"><span class="tag">${t.subject||'—'}</span><span class="tag">${Math.ceil((t.minutes||25)/25)}🍅</span></div>
    <small>可交付：${t.deliverable}</small>
    <div class="actions">
      <button data-act="today">+ 日历</button>
      <button class="ghost" data-act="done">${t.status==='done'?'已完成':'标记完成'}</button>
      <button class="ghost" data-act="del">删除</button>
    </div>`;
  card.ondragstart = (e)=>{ e.dataTransfer.setData('text/plain', t.id); };
  card.onclick = (e)=>{
    const act = e.target.dataset.act;
    if(!act) return;
    if(act==='del'){ db.tasks = db.tasks.filter(x=>x.id!==t.id); save(); }
    if(act==='done'){ t.status = t.status==='done'?'todo':'done'; save(); }
    if(act==='today'){
      // 默认放今天
      const key = 'day-' + new Date().toISOString().slice(0,10);
      (db.plan[key] ||= []).push(t.id);
      save();
      document.querySelector('.tab-btn[data-tab="calendar"]').click();
    }
  };
  return card;
}

document.getElementById('clearDone').onclick = ()=>{
  db.tasks = db.tasks.filter(t=>t.status!=='done'); save();
};
document.getElementById('filterProject').onchange = render;
document.getElementById('filterStatus').onchange = render;

// ===== Calendar drag targets =====
document.querySelectorAll('.day .droplist').forEach(list=>{
  list.ondragover = (e)=>{ e.preventDefault(); list.style.background = '#eef'; };
  list.ondragleave = ()=>{ list.style.background = ''; };
  list.ondrop = (e)=>{
    e.preventDefault();
    list.style.background='';
    const id = e.dataTransfer.getData('text/plain');
    const key = list.dataset.drop;
    (db.plan[key] ||= []).push(id);
    save();
  };
});

function renderCalendar(){
  document.querySelectorAll('.day .droplist').forEach(list=>{
    const key = list.dataset.drop;
    list.innerHTML='';
    (db.plan[key]||[]).forEach(id=>{
      const t = db.tasks.find(x=>x.id===id);
      if(!t) return;
      const c = document.createElement('div');
      c.className='card';
      c.innerHTML = `<strong>${t.title}</strong>
        <div class="actions"><button data-id="${id}" data-where="${key}" class="ghost">移除</button></div>`;
      c.querySelector('button').onclick = (e)=>{
        const {id, where} = e.target.dataset;
        db.plan[where] = (db.plan[where]||[]).filter(x=>x!==id);
        save();
      };
      list.appendChild(c);
    });
  });
}

// ===== Stats =====
function renderStats(){
  document.getElementById('allCount').textContent = db.tasks.length;
  document.getElementById('doneCount').textContent = db.tasks.filter(t=>t.status==='done').length;
  const byProject = {};
  db.tasks.forEach(t=>{
    const p = db.projects.find(x=>x.id===t.projectId);
    const key = p ? p.title : '未归属';
    byProject[key] = (byProject[key]||0) + (t.status==='done'?1:0);
  });
  const wrap = document.getElementById('byProject');
  wrap.innerHTML='';
  Object.entries(byProject).forEach(([k,v])=>{
    const span = document.createElement('span');
    span.className='tag';
    span.textContent = `${k}：完成 ${v}`;
    wrap.appendChild(span);
  });
}

// ===== Export backup =====
document.getElementById('exportBtn').onclick = ()=>{
  const blob = new Blob([JSON.stringify(db,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ai-planner-backup.json';
  a.click();
};

// ===== Render all =====
function render(){
  renderProjects();
  renderTasks();
  renderCalendar();
  renderStats();
}
render();
