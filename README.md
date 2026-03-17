# Agent Gateway

> 多智能体任务编排系统 - 基于 Claude Code 的智能体协作平台

## 概述

Agent Gateway 是一个多智能体协作系统，通过命令行方式管理智能体、创建团队、发起协作任务。基于 Claude Code 的 `--agents` 功能实现智能体协调。

## 特性

- 🤖 **智能体管理** - 创建、配置、删除智能体
- 👥 **团队协作** - 创建团队、添加成员
- 🚀 **任务编排** - 发起多智能体协作任务
- ✅ **TDD 开发** - 完整的测试覆盖 (130+ 测试)

## 安装

```bash
# 克隆项目
git clone https://github.com/your-repo/agent-gateway.git
cd agent-gateway

# 安装依赖
npm install

# 构建
npm run build
```

## 快速开始

### 1. 创建智能体

```bash
# 创建程序员智能体
./dist/index.js agent create --name coder --role "程序员" --specialty "TypeScript"

# 创建设计师智能体
./dist/index.js agent create --name designer --role "设计师" --specialty "UI/UX"
```

### 2. 创建团队

```bash
# 创建团队
./dist/index.js team create --name "blog-dev" --description "博客开发团队"

# 添加成员
./dist/index.js team add coder --team blog-dev
./dist/index.js team add designer --team blog-dev
```

### 3. 发起任务

```bash
# 单智能体任务
./dist/index.js run "用 TypeScript 实现一个计算器" --agents coder

# 多智能体协作
./dist/index.js run "开发一个登录页面" --agents coder,designer
```

## 命令参考

### 智能体命令

```bash
# 创建智能体
agent-gateway agent create --name <名称> --role <角色> --specialty <专业>

# 列出智能体
agent-gateway agent list

# 查看详情
agent-gateway agent show <名称>

# 删除智能体
agent-gateway agent delete <名称>
```

### 团队命令

```bash
# 创建团队
agent-gateway team create --name <名称>

# 添加成员
agent-gateway team add <智能体名> --team <团队名>

# 列出团队
agent-gateway team list

# 查看详情
agent-gateway team show <名称>

# 删除团队
agent-gateway team delete <名称>
```

### 任务命令

```bash
# 发起任务
agent-gateway run "<任务描述>" --agents <智能体1>,<智能体2>
```

## 配置

智能体配置文件位于 `~/.agent-gateway/agents/` 目录：

```json
{
  "name": "coder",
  "role": "程序员",
  "specialty": "TypeScript, Node.js",
  "personality": "严谨",
  "model": "sonnet"
}
```

## 测试

```bash
# 运行所有测试
npm test

# 运行测试并查看覆盖率
npm run test:coverage
```

## 架构

```
┌─────────────────────────────────────────────┐
│           Agent Gateway CLI                   │
│  - 智能体配置管理                             │
│  - 任务编排                                  │
│  - 调用 Claude CLI                           │
└───────────────────┬──────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│         Claude CLI (--agents)               │
│  - Subagents 协作                           │
│  - 任务分配与结果汇总                        │
└─────────────────────────────────────────────┘
```

## 示例

查看 `examples/` 目录获取完整示例：

- `login.html` - 登录页面示例

## 技术栈

- TypeScript
- Node.js
- Vitest (测试)
- Claude Code CLI

## 许可证

MIT
