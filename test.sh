#!/bin/bash

# Agent Gateway 测试脚本

CLI_PATH="/Users/yulong/playground/agent-gateway/dist/index.js"
TEST_DIR=$(mktemp -d)

echo "=== Agent Gateway 测试脚本 ==="
echo "测试目录: $TEST_DIR"
echo ""

# 设置测试配置目录
export AG_CONFIG_DIR="$TEST_DIR"

# 清理函数
cleanup() {
    echo ""
    echo "=== 清理测试环境 ==="
    rm -rf "$TEST_DIR"
    echo "已清理: $TEST_DIR"
}
trap cleanup EXIT

# 测试 1: 创建智能体
echo "=== 测试 1: 创建智能体 ==="
node $CLI_PATH agent create --name test-coder --role "程序员" --specialty "TypeScript" --personality "严谨"
echo ""

# 测试 2: 创建团队
echo "=== 测试 2: 创建团队 ==="
node $CLI_PATH team create --name test-team --description "测试团队"
echo ""

# 测试 3: 添加成员
echo "=== 测试 3: 添加成员到团队 ==="
node $CLI_PATH team add test-coder --team test-team
echo ""

# 测试 4: 列出智能体
echo "=== 测试 4: 列出智能体 ==="
node $CLI_PATH agent list
echo ""

# 测试 5: 列出团队
echo "=== 测试 5: 列出团队 ==="
node $CLI_PATH team list
echo ""

# 测试 6: 团队详情
echo "=== 测试 6: 团队详情 ==="
node $CLI_PATH team show test-team
echo ""

# 测试 7: 智能体详情
echo "=== 测试 7: 智能体详情 ==="
node $CLI_PATH agent show test-coder
echo ""

# 测试 8: 发起任务 (简单任务)
echo "=== 测试 8: 发起任务 ==="
echo "任务: 用一句话介绍 Go 语言"
node $CLI_PATH run "用一句话介绍 Go 语言" --agents test-coder
echo ""

# 测试 9: 删除智能体
echo "=== 测试 9: 删除智能体 ==="
node $CLI_PATH agent delete test-coder
echo ""

# 测试 10: 删除团队
echo "=== 测试 10: 删除团队 ==="
node $CLI_PATH team delete test-team
echo ""

echo "=== 所有测试完成 ==="
