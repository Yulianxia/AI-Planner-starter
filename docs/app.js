// Debug build debug-1755032867
(function(){

  const db = JSON.parse(localStorage.getItem('aiPlannerDB')||'{}');
  db.projects ||= [];
  db.tasks ||= [];
  db.plan ||= {morning:[],afternoon:[],evening:[]};

  function save(){ localStorage.setItem('aiPlannerDB', JSON.stringify(db)); render(); }

  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.onclick=()=>{
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    };
  });

  const projectForm = document.getElementById('projectForm');
  projectForm.onsubmit = e => {
    e.preventDefault();
    const p = {
      id: crypto.randomUUID(),
      title: document.getElementById('pTitle').value.trim(),
      due: document.getElementById('pDue').value || '',
      priority: document.getElementById('pPriority').value
    };
    if(!p.title) return;
    db.projects.push(p);
    projectForm.reset();
    save();
  };

  function renderProjects(){
    const wrap = document.getElementById('projectList');
    wrap.innerHTML='';
    db.projects.forEach(p=>{
      const card = document.createElement('div');
      card.className='card';
      card.innerHTML = `
        <strong>${p.title}</strong>
        <small>截止：${p.due||'—'} · 优先：${p.priority}</small>
        <div class="actions">
          <button data-act="gen" data-id="${p.id}">AI 生成任务</button>
          <button class="ghost" data-act="del" data-id="${p.id}">删除</button>
        </div>`;
      wrap.appendChild(card);
    });
  }

  document.getElementById('projectList').onclick = async (e)=>{
    const id = e.target.dataset.id;
    const act = e.target.dataset.act;
    if(!id || !act) return;
    const project = db.projects.find(p=>p.id===id);
    if(act==='del'){
      if(confirm('确定删除项目及其任务？')){
        db.tasks = db.tasks.filter(t=>t.projectId!==id);
        db.projects = db.projects.filter(p=>p.id!==id);
        save();
      }
    }
    if(act==='gen'){ await genTasksForProject(project); }
  };

  const genBtn = document.getElementById('genTasksBtn');
  if(genBtn){
    genBtn.onclick = async ()=>{
      if(db.projects.length===0){
        const p = {id:crypto.randomUUID(), title:'数学提升', due:'', priority:'high'};
        db.projects.push(p);
      }
      const project = db.projects[db.projects.length-1];
      await genTasksForProject(project);
      document.querySelector('.tab-btn[data-tab="tasks"]').click();
    };
  }

  function builtinGenerator(name){
    if(/读|阅读|书|reading/.test(name)) return [
      {title:'自由阅读 20 分钟', deliverable:'阅读记录/家长签字', minutes:25},
      {title:'复述故事要点', deliverable:'语音/文字截图', minutes:25},
      {title:'生词卡片 10 个', deliverable:'拍照单词卡', minutes:25},
    ];
    if(/英语|英文|english|单词|词汇/.test(name)) return [
      {title:'单词卡片 20 个', deliverable:'测验截图', minutes:25},
      {title:'听写 10 个', deliverable:'听写纸照片', minutes:25},
      {title:'口语 1 分钟', deliverable:'口语录音', minutes:25},
    ];
    if(/运动|体育|跑步|跳绳|球/.test(name)) return [
      {title:'热身 + 拉伸', deliverable:'家长确认', minutes:25},
      {title:'跳绳 5×2 分钟', deliverable:'计数记录', minutes:25},
      {title:'平板 3×30秒', deliverable:'成绩记录', minutes:25},
    ];
    return [
      {title:'二位数加法口算20题', deliverable:'拍照答题纸', minutes:25},
      {title:'减法退位口算15题', deliverable:'拍照答题纸', minutes:25},
      {title:'乘法口诀复习', deliverable:'录音背诵', minutes:25},
    ];
  }

  async function genTasksForProject(project){
    const tasks = builtinGenerator(project.title);
    tasks.forEach(t=> db.tasks.push({
      id: crypto.randomUUID(),
      projectId: project.id,
      title: t.title,
      deliverable: t.deliverable,
      minutes: t.minutes,
      status: 'todo'
    }));
    alert('已生成任务：'+tasks.length+' 条');
    save();
  }

  function renderTasks(){
    const wrap = document.getElementById('taskList');
    wrap.innerHTML='';
    db.tasks.forEach(t=> wrap.appendChild(taskCard(t)));
  }

  function taskCard(t){
    const card = document.createElement('div');
    card.className='card';
    card.draggable = true;
    card.dataset.id = t.id;
    card.innerHTML = `
      <strong>${t.title}</strong>
      <small>建议：${t.minutes} 分钟 · 可交付：${t.deliverable}</small>
      <div class="actions">
        <button data-act="today">+ 今日</button>
        <button class="ghost" data-act="done">${t.status==='done'?'已完成':'标记完成'}</button>
        <button class="ghost" data-act="del">删除</button>
      </div>`;
    card.onclick = (e)=>{
      const act = e.target.dataset.act;
      if(!act) return;
      if(act==='del'){ db.tasks = db.tasks.filter(x=>x.id!==t.id); save(); }
      if(act==='done'){ t.status = t.status==='done'?'todo':'done'; save(); }
      if(act==='today'){ alert('示例：已加入今天'); }
    };
    return card;
  }

  function renderPlan(){}

  function render(){ renderProjects(); renderTasks(); renderPlan(); }
  render();

  if(window.__APP_READY__) window.__APP_READY__();
})();
