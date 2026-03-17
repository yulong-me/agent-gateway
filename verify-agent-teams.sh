#!/bin/bash

# Agent Teams 原理验证脚本
# 验证目标：智能体之间能否直接通信

echo "=== Agent Teams 原理验证 ==="
echo ""

# 1. 检查 Agent Teams 是否启用
echo "1. 检查 Agent Teams 状态..."

# 移除 CLAUDECODE 环境变量（避免嵌套会话）
unset CLAUDECODE

# 启用 Agent Teams 实验性功能
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

echo "   ✅ Agent Teams 已启用 (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1)"
echo ""

# 2. 创建测试用的临时目录
TEST_DIR=$(mktemp -d)
echo "2. 测试目录: $TEST_DIR"

# 3. 创建测试智能体配置
mkdir -p "$TEST_DIR/.claude"
cat > "$TEST_DIR/agents.json" << 'EOF'
{
  "frontend-dev": {
    "description": "前端开发工程师",
    "prompt": "你是一个专业的前端开发工程师，擅长 React 和 TypeScript。",
    "tools": ["Read", "Write", "Edit", "Bash"]
  },
  "designer": {
    "description": "UI 设计师",
    "prompt": "你是一个专业的 UI 设计师，擅长现代简约风格设计。",
    "tools": ["Read"]
  }
}
EOF

echo "3. 创建测试智能体配置完成"
echo ""

# 4. 测试场景 1: 简单任务 - 单智能体
echo "=== 测试场景 1: 单智能体任务 ==="
cd "$TEST_DIR"
claude -p "用一句话介绍 TypeScript" --agents "$(cat agents.json)" 2>&1 | head -20

echo ""
echo "=== 测试场景 2: 多智能体任务 ==="
echo "任务: 前端工程师和设计师协作设计一个按钮"
echo ""

# 5. 测试场景 2: 多智能体协作
# 使用自然语言描述团队协作
claude -p "创建一个小队: 一个前端工程师负责实现代码，一个设计师负责设计界面，让他们协作设计一个按钮组件。最后由你说一句话总结他们各自做了什么。" \
  --agents "$(cat agents.json)" \
  --verbose 2>&1 | head -50

echo ""
echo "=== 验证完成 ==="
echo ""

# 清理
rm -rf "$TEST_DIR"
