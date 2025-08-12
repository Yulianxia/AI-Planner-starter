// ===== Data =====
const db = JSON.parse(localStorage.getItem('aiPlannerDB')||'{}');
db.projects ||= [];
db.tasks ||= [];
db.plan ||= {morning:[],afternoon:[],evening:[]};

function save(){ localStorage.setItem('aiPlannerDB', JSON.stringify(db)); render(); }

// ===== Tabs =====
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  };
});

// ===== Projects =====
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

// Render projects
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
  // update filter select
  const sel = document.getElementById('filterProject');
  sel.innerHTML = '<option value="all">所有项目</option>' + db.projects.map(p=>`<option value="${p.id}">${p.title}</option>`).join('');
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
  if(act==='gen'){
    await genTasksForProject(project);
  }
};

// ===== AI generation (optional OpenAI) =====
async function genTasksForProject(project){
  const age = parseInt(document.getElementById('childAge').value||'10',10);
  const level = document.getElementById('level').value;
  const useOpenAI = document.getElementById('useOpenAI').checked;
  const key = document.getElementById('openaiKey').value.trim();
  if(useOpenAI && !key){ alert('请输入 OpenAI API Key，或取消勾选“使用OpenAI”'); return; }

  let tasks = [];
  if(useOpenAI){
    // Call OpenAI (browser fetch). Key is stored in memory only.
    try{
      const prompt = `你是学习教练。把“${project.title}”拆成6-10个具体小任务，每个任务给出：任务名、可交付物、建议时长(按${age}岁)、所需材料。难度水平：${level}。输出JSON数组，字段: title, deliverable, minutes`;
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages:[{role:'user', content: prompt}],
          temperature:0.4
        })
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '[]';
      tasks = JSON.parse(text);
    }catch(err){
      console.error(err);
      alert('调用 OpenAI 失败，改用内置模板生成。');
      tasks = builtinGenerator(project.title, age, level);
    }
  }else{
    tasks = builtinGenerator(project.title, age, level);
  }

  // write to db
  tasks.forEach(t=> db.tasks.push({
    id: crypto.randomUUID(),
    projectId: project.id,
    title: t.title || t.任务 || '待命名任务',
    deliverable: t.deliverable || '完成记录/照片',
    minutes: t.minutes || 25,
    status: 'todo'
  }));
  alert('已生成任务：'+tasks.length+' 条');
  save();
}


function builtinGenerator(name, age, level){
  // 标准化关键词
  const n = (name||'').toLowerCase();

  // —— 阅读 ——
  if(/读|阅读|书|reading/.test(name)){
    return [
      {title:'自由阅读 20 分钟', deliverable:'阅读记录/家长签字', minutes:25},
      {title:'复述故事要点（口头或书面）', deliverable:'语音/文字截图', minutes:25},
      {title:'生词卡片 10 个', deliverable:'拍照单词卡', minutes:25},
      {title:'段落朗读与停顿标记', deliverable:'朗读录音', minutes:25},
      {title:'写一段读后感（80~120字）', deliverable:'拍照/截图', minutes:25},
      {title:'整理人物关系或思维导图', deliverable:'手绘图/照片', minutes:25}
    ];
  }

  // —— 英语 ——
  if(/英语|英文|english|单词|词汇/.test(name)){
    const base = [
      {title:'单词卡片 20 个（看-遮-写）', deliverable:'测验截图', minutes:25},
      {title:'听写 10 个（家长读）', deliverable:'听写纸照片', minutes:25},
      {title:'自然拼读/发音操练', deliverable:'录音 1 段', minutes:25},
      {title:'随文理解练习 1 篇', deliverable:'完成截图', minutes:25},
      {title:'口语微任务：自我介绍 1 分钟', deliverable:'口语录音', minutes:25}
    ];
    if(level==='高'){
      base.push({title:'短文写作：My Favorite Sport', deliverable:'截图/照片', minutes:25});
    } else if(level==='低'){
      base.unshift({title:'字母书写操练（易错3行）', deliverable:'拍照练习纸', minutes:25});
    }
    return base;
  }

  // —— 运动 ——
  if(/运动|体育|sports|跑步|跳绳|球/.test(name)){
    return [
      {title:'热身 10 分钟 + 拉伸', deliverable:'动作照片/家长确认', minutes:25},
      {title:'有氧：跳绳 5×2 分钟（间歇）', deliverable:'计数记录', minutes:25},
      {title:'核心力量：平板 3×30 秒 + 仰卧起坐 3×12', deliverable:'成绩记录', minutes:25},
      {title:'技能练习：投篮/运球/颠球 15 分钟', deliverable:'小视频 15 秒', minutes:25},
      {title:'放松拉伸 10 分钟', deliverable:'家长确认', minutes:25}
    ];
  }

  // —— 数学 / 默认 ——
  const math = [
    {title:'二位数加法口算20题', deliverable:'拍照答题纸', minutes:25},
    {title:'减法退位口算15题', deliverable:'拍照答题纸', minutes:25},
    {title:'乘法口诀复习 · 3/4/6/7', deliverable:'录音背诵', minutes:25},
    {title:'单位换算：cm↔mm↔m 练习', deliverable:'完成表格', minutes:25},
    {title:'几何：量角器读数10题', deliverable:'拍照练习', minutes:25}
  ];
  if(level==='高'){
    math.push({title:'两位数乘法三种心算策略', deliverable:'演算纸照片', minutes:25});
  } else if(level==='低'){
    math.unshift({title:'口算热身：加减各10题', deliverable:'拍照答题纸', minutes:25});
  }
  return math;
}

  ];
  if(/英语|单词/i.test(name)) return [
    {title:'单词卡片20个', deliverable:'测验截图', minutes:25},
    {title:'听写10个', deliverable:'听写纸照片', minutes:25},
    {title:'随文小练习', deliverable:'完成截图', minutes:25},
    {title:'英文短文朗读', deliverable:'录音', minutes:25},
    {title:'看英语动画', deliverable:'观后感', minutes:25}
  ];
  if(/运动|体育|锻炼/i.test(name)) return [
    {title:'热身运动5分钟', deliverable:'视频', minutes:5},
    {title:'跳绳100个', deliverable:'视频', minutes:10},
    {title:'仰卧起坐20个', deliverable:'视频', minutes:10},
    {title:'跑步10分钟', deliverable:'视频', minutes:10},
    {title:'拉伸放松5分钟', deliverable:'视频', minutes:5}
  ];

  // simple rules for demo
  const base = [
    {title:'二位数加法口算20题', deliverable:'拍照答题纸', minutes:25},
    {title:'减法退位口算15题', deliverable:'拍照答题纸', minutes:25},
    {title:'乘法口诀复习 · 3/4/6/7', deliverable:'录音背诵', minutes:25},
    {title:'单位换算：cm↔mm↔m 练习', deliverable:'完成表格', minutes:25},
    {title:'几何：量角器读数10题', deliverable:'拍照练习', minutes:25}
  ];
  if(/读|书|阅读/i.test(name)) return [
    {title:'阅读20分钟', deliverable:'阅读记录', minutes:25},
    {title:'复述故事要点', deliverable:'语音/文字摘录', minutes:25},
    {title:'生词卡片10个', deliverable:'拍照单词卡', minutes:25}
  ];
  if(/英语|单词/i.test(name)) return [
    {title:'单词卡片20个', deliverable:'测验截图', minutes:25},
    {title:'听写10个', deliverable:'听写纸照片', minutes:25},
    {title:'随文小练习', deliverable:'完成截图', minutes:25}
  ];
  return base;
}

// ===== Tasks render & drag =====
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
  card.className = 'card';
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
  card.ondragstart = (e)=>{ e.dataTransfer.setData('text/plain', t.id); };
  card.onclick = (e)=>{
    const act = e.target.dataset.act;
    if(!act) return;
    if(act==='del'){ db.tasks = db.tasks.filter(x=>x.id!==t.id); save(); }
    if(act==='done'){ t.status = t.status==='done'?'todo':'done'; save(); }
    if(act==='today'){ db.plan.morning.push(t.id); save(); }
  };
  return card;
}

// Drop areas
document.querySelectorAll('.droplist').forEach(list=>{
  list.ondragover = (e)=>{ e.preventDefault(); list.style.background = '#eef'; };
  list.ondragleave = ()=>{ list.style.background = ''; };
  list.ondrop = (e)=>{
    e.preventDefault();
    list.style.background = '';
    const id = e.dataTransfer.getData('text/plain');
    const where = list.dataset.drop;
    if(where==='pool') return; // ignore
    db.plan[where].push(id);
    save();
  };
});

// Auto plan: pick top 3 todos within 3 tomatoes
document.getElementById('autoPlan').onclick = ()=>{
  db.plan = {morning:[],afternoon:[],evening:[]};
  const todos = db.tasks.filter(t=>t.status==='todo').slice(0,6);
  ['morning','afternoon','evening'].forEach((lane,i)=>{
    if(todos[i]) db.plan[lane].push(todos[i].id);
  });
  save();
};

document.getElementById('clearDone').onclick = ()=>{
  db.tasks = db.tasks.filter(t=>t.status!=='done'); save();
};

document.getElementById('filterProject').onchange = render;
document.getElementById('filterStatus').onchange = render;

document.getElementById('useOpenAI').onchange = (e)=>{
  document.getElementById('openaiKey').style.display = e.target.checked? 'block':'none';
};

// Export backup
document.getElementById('exportBtn').onclick = ()=>{
  const blob = new Blob([JSON.stringify(db,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ai-planner-backup.json';
  a.click();
};

function renderPlan(){
  ['morning','afternoon','evening'].forEach(lane=>{
    const el = document.getElementById('lane-'+lane);
    el.innerHTML='';
    db.plan[lane].forEach(id=>{
      const t = db.tasks.find(x=>x.id===id);
      if(!t) return;
      const c = document.createElement('div');
      c.className='card';
      c.innerHTML = `<strong>${t.title}</strong><small>番茄：${Math.ceil((t.minutes||25)/25)}</small>`;
      el.appendChild(c);
    });
  });
}

// ===== Render all =====
function render(){
  renderProjects();
  renderTasks();
  renderPlan();
}
render();
