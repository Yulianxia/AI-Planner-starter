let tasks = [];
let weeklyPlan = [[],[],[],[],[],[],[]];
let timerInterval;

function generateTasks() {
    const project = document.getElementById('project-name').value;
    const age = document.getElementById('child-age').value;
    const grade = document.getElementById('child-grade').value;
    const book = document.getElementById('child-book').value;
    const goal = document.getElementById('child-goal').value;

    // 模拟 AI 生成任务
    tasks = [
        project + " 基础练习",
        project + " 阅读理解",
        project + " 口语练习",
        "复习 " + book,
        "完成 " + grade + " 的作业",
        "检查是否达到目标：" + goal
    ];

    let list = document.getElementById('task-list');
    list.innerHTML = "";
    tasks.forEach((t,i)=>{
        let li = document.createElement('li');
        li.textContent = t;
        list.appendChild(li);
    });

    document.getElementById('project-input').style.display = "none";
    document.getElementById('task-suggestions').style.display = "block";
}

function createWeeklyPlan() {
    // 平均分配任务
    tasks.forEach((task, index) => {
        weeklyPlan[index % 7].push(task);
    });

    let grid = document.getElementById('week-grid');
    grid.innerHTML = "";
    let days = ["周一","周二","周三","周四","周五","周六","周日"];
    days.forEach((d, i)=>{
        let div = document.createElement('div');
        div.className = "day";
        div.innerHTML = "<strong>" + d + "</strong><br>";
        weeklyPlan[i].forEach(task=>{
            let t = document.createElement('div');
            t.className = "task";
            t.textContent = task;
            t.onclick = ()=>executeTask(task);
            div.appendChild(t);
        });
        grid.appendChild(div);
    });

    document.getElementById('task-suggestions').style.display = "none";
    document.getElementById('weekly-plan').style.display = "block";
}

function executeTask(task) {
    document.getElementById('weekly-plan').style.display = "none";
    document.getElementById('task-execution').style.display = "block";
    document.getElementById('current-task').textContent = task;
}

function startPomodoro() {
    let timeLeft = 25 * 60; // 25 分钟
    document.getElementById('timer').textContent = formatTime(timeLeft);
    timerInterval = setInterval(()=>{
        timeLeft--;
        document.getElementById('timer').textContent = formatTime(timeLeft);
        if(timeLeft <= 0){
            clearInterval(timerInterval);
            alert("番茄钟完成！休息5分钟吧！");
        }
    },1000);
}

function formatTime(seconds) {
    const m = Math.floor(seconds/60);
    const s = seconds % 60;
    return m + ":" + (s<10?"0":"") + s;
}