# Agent Gateway 设计文档

## 1. 项目概述

**Agent Gateway** 是一个基于 Claude Code CLI 的多智能体任务编排系统。

### 目标

- 提供命令行工具管理多个自定义智能体
- 支持多智能体协作完成任务
- 基于 Claude Code 的 Agent Teams 特性实现智能体间通信

---

## 2. 技术选型

### 底层引擎

| 功能 | 技术 |
|------|------|
| 智能体运行 | Claude Code CLI (`claude`) |
| 多智能体协作 | Agent Teams (实验性) |
| 对话保持 | Agent Teams 内置支持 |
| 智能体间通信 | Agent Teams 邮箱系统 |

### 关键技术点

- **Agent Teams**: Claude CLI 实验性功能，提供共享任务列表和邮箱系统
- **--agents CLI 选项**: 用于定义自定义智能体
- **session 管理**: 通过 `--session-id` 保持会话

### 为什么不使用 Agent SDK

Agent SDK 目前不支持 Agent Teams，仅支持 Subagents（子智能体），无法实现多智能体间的直接通信。

---

## 3. 系统架构

```
┌─────────────────────────────────────────────┐
│            Agent Gateway CLI (ag)            │
│  - 智能体配置管理                            │
│  - 任务编排                                 │
│  - 调用 Claude CLI (启用 Agent Teams)       │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│         Claude CLI (Agent Teams 模式)       │
│  - 共享任务列表                             │
│  - 邮箱系统                                 │
│  - 智能体协调                               │
└─────────────────────────────────────────────┘
```

---

## 4. 目录结构

```
~/.agent-gateway/
├── config.yaml              # 全局配置
├── agents/
│   ├── coder.json          # 智能体配置
│   ├── designer.json
│   └── tester.json
├── tasks/                  # 任务历史
│   └── 2026-03-16/
│       └── task-xxx.json
└── logs/                   # 执行日志
```

---

## 5. 智能体配置格式

```json
{
  "name": "coder",
  "role": "程序员",
  "personality": "严谨、高效",
  "specialty": "TypeScript, Node.js, React",
  "model": "sonnet",
  "tools": ["Read", "Edit", "Write", "Bash", "Glob", "Grep"],
  "description": "专业程序员，擅长 TypeScript 开发"
}
```

---

## 6. 核心命令设计

### 智能体管理

```bash
# 交互式创建
ag agent create

# 指定配置创建
ag agent create --name coder --role 程序员 --specialty TypeScript

# 列出所有智能体
ag agent list

# 查看智能体详情
ag agent show <name>

# 删除智能体
ag agent delete <name>
```

### 任务管理

```bash
# 发起任务（使用已配置的智能体）
ag run "任务描述"

# 指定智能体
ag run "任务描述" --agents coder,designer,tester

# 指定协调者
ag run "任务描述" --agents coder,designer --coordinator manager

# 查看任务历史
ag task list

# 查看任务详情
ag task show <id>
```

### 团队管理

```bash
# 创建团队
ag team create

# 添加成员
ag team add <agent>

# 列出团队
ag team list
```

### 全局配置

```bash
# 查看配置
ag config

# 设置配置
ag config set <key> <value>
```

---

## 7. 任务发起流程

```
用户输入
    │
    ▼
ag run "开发一个博客系统" --agents coder,designer,tester
    │
    ▼
┌─────────────────────────────────────────────┐
│  1. 加载智能体配置                          │
│  2. 构建 --agents JSON                     │
│  3. 生成协调 prompt                        │
│  4. 调用 claude CLI (启用 Agent Teams)    │
└─────────────────────────────────────────────┘
```

### Agent Teams 启用方式

```bash
# 方式1: 环境变量
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

# 方式2: settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

---

## 8. Agent Teams 核心特性

### 架构组件

| 组件 | 角色 |
|------|------|
| Team Lead | 主智能体，创建团队、协调工作、分配任务 |
| Teammates | 独立 Claude 实例，各自有独立上下文 |
| Task List | 共享任务列表（pending/in-progress/completed） |
| Mailbox | 智能体间通信系统 |

### 对话保持与通信

- **共享任务列表**: 任务状态自动同步
- **邮箱系统**: 智能体之间直接发消息
- **上下文共享**: 每个智能体独立上下文，可通过消息通信

### 显示模式

- **in-process**: 所有智能体运行在主终端，Shift+Down 切换
- **split panes**: 每个智能体独立终端窗口（需要 tmux 或 iTerm2）

---

## 9. 协调策略

由于 Agent Teams 内置协调能力，我们通过自然语言描述任务结构：

```typescript
// 协调 prompt 模板
const coordinatorPrompt = `
你是一个项目经理，负责协调多个智能体完成以下任务：
${task}

智能体团队：
${agents.map(a => `- ${a.name} (${a.role}): ${a.specialty}`).join('\n')}

请按照以下步骤协调：
1. 分析任务，拆分子任务
2. 分配给合适的智能体
3. 收集结果，整合输出
4. 确保各智能体的工作协调一致
`;
```

---

## 10. 使用示例

```bash
# 1. 创建智能体
ag agent create --name coder --role 程序员 --specialty TypeScript
ag agent create --name designer --role UI设计师 --specialty UI/UX
ag agent create --name tester --role 测试工程师 --specialty E2E测试

# 2. 查看智能体列表
ag agent list

# 3. 发起协作任务
ag run "开发一个个人博客系统" --agents coder,designer,tester

# 或使用团队
ag team create --name blog-team --agents coder,designer,tester
ag run "开发一个个人博客系统" --team blog-team
```

---

## 11. 后续计划

- [ ] 实现智能体配置管理
- [ ] 实现任务发起和编排
- [ ] 集成 Agent Teams
- [ ] 添加团队管理功能
- [ ] 实现任务历史和日志

---

## 12. 参考资料

- [Claude Code 文档](https://code.claude.com/docs)
- [Agent Teams 文档](https://code.claude.com/docs/en/agent-teams)
- [Subagents 文档](https://code.claude.com/docs/en/sub-agents)
- [--agents CLI 选项](https://code.claude.com/docs/en/command-line)
