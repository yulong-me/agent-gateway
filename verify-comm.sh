#!/bin/bash

# Agent Teams 通信验证 - 简化版

unset CLAUDECODE
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

echo "=== Agent Teams 通信验证 ==="
echo ""

# 直接使用 --agents 创建两个智能体并让他们对话
echo "测试: 两个智能体直接对话"
echo "---"

claude -p "请创建一个团队，包含两个人:
1. alice - 一个喜欢说 '你好' 的人
2. bob - 一个喜欢说 '再见' 的人

让 alice 对 bob 说 '你好'，然后 bob 回复 '再见'。

最后告诉我 bob 说了什么，只需要一句话。" \
  --agents '{
    "alice": {
      "description": "喜欢打招呼的人",
      "prompt": "你叫 alice，你喜欢说 你好 来打招呼。",
      "tools": []
    },
    "bob": {
      "description": "喜欢告别的人",
      "prompt": "你叫 bob，你喜欢说 再见 来告别。",
      "tools": []
    }
  }' \
  --dangerously-skip-permissions 2>&1

echo ""
echo "=== 验证完成 ==="
