# 数据结构（JSON 示例）

```json
Project: { "id": "p1", "title": "数学提升", "goal": "四则运算熟练", "due": "2025-09-01", "priority": "high", "owner": "parent" }

Task: { "id": "t1", "projectId": "p1", "title": "二位数加法口算20题", "deliverable": "拍照上传答题纸", "materials": "练习册/纸/铅笔", "estMinutes": 25, "difficulty": "medium", "dependsOn": [], "status": "todo" }

ScheduleItem: { "id": "s1", "taskId": "t1", "date": "2025-08-20", "start": "09:00", "end": "09:25", "completed": false }

User: { "id": "u1", "role": "parent", "age": 10, "focusBlock": 25 }

Reflection: { "id": "r1", "date": "2025-08-20", "didWell": "按时完成两番茄", "stuck": "乘法口算速度慢", "planTomorrow": "先做乘法再阅读" }
```
