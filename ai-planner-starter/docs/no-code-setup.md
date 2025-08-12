# 无代码搭建步骤（Glide + Make + GitHub Pages）

> 目标：完全不写代码，做出一个能演示“AI 自动拆任务 + 番茄计划”的手机 App，并把结果展示到 GitHub Pages。

## A. 数据与界面（Glide）
1. 注册并登录 [glideapps.com]。
2. 选择 **Templates → Start from Google Sheets**（或 Glide Tables）。
3. 新建这些表：`Projects`、`Tasks`、`Plan`、`Reflections`、`Settings`。
4. 页面：
   - **Projects**（列表 → 详情 → 按钮“AI 生成任务”）
   - **Tasks**（任务列表，可编辑/排序/合并）
   - **Today**（孩子视图：显示“今天三件事”和勾选）
   - **Reports**（周完成率、超载提醒）
   - **Settings**（年龄、水平、每日上限分钟数、长休时长）

## B. 接 AI（两种途径）
- **方式 1：Glide 内置 OpenAI**  
  在项目详情页添加一个 **Action → OpenAI**，把 `docs/prompts.md` 中的“任务分解器”提示词复制进去，变量映射到表字段。AI 输出写入 `Tasks` 表（用“添加多个行”或写入富文本再解析）。

- **方式 2：Make.com（更灵活）**  
  1) 新建 Scenario：Glide trigger → OpenAI（Chat Completions）→ Google Sheets/Glide Tables。  
  2) 把 AI 输出写成 Markdown 或 JSON；
  3) 如果是 Markdown 表格，用 Make 的“Parse Markdown Table”模块，逐行写入 `Tasks` 表。

## C. 番茄时间表
1. 在 `Settings` 里设置：番茄长度(25)、短休(5)、长休(15)、两番茄后长休(True)。  
2. 在 `Tasks` 表创建计算列：`tomatoes = ceil(estMinutes / 25)`。  
3. “生成今日计划”按钮 → Action：
   - 读取 `Tasks` 的优先级顺序；
   - 根据 `tomatoes` 迭代生成 `Plan` 行：每个任务分配若干 25 分钟块；
   - 每两个番茄插入一条“长休”记录。

## D. 导出与展示
- 导出日程到 Google 日历（Glide 集成）或生成一段 Markdown（复制到家长群）。
- 在 GitHub Pages（本仓库 `docs/`）展示你的流程图、截图、录屏链接。

## E. 最终你要准备的 3 个素材
1) 孩子的项目清单样例（3–5 个）  
2) 一次“AI 生成 → 编辑 → 生成日程”的录屏（手机录屏即可）  
3) 周报截图（完成率、奖章数）
