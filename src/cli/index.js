#!/usr/bin/env node

/**
 * grow-ruler CLI 命令行工具
 * 支持命令：start, stop, restart, status, help
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PID_FILE = path.join(__dirname, '../../.server.pid');
const LOG_FILE = path.join(__dirname, '../../.server.log');

function getPort() {
  return process.env.PORT || 24010;
}

function isRunning(pid) {
  try {
    if (process.platform === 'win32') {
      execSync(`tasklist /FI "PID eq ${pid}"`, { stdio: 'ignore' });
      return true;
    } else {
      execSync(`kill -0 ${pid}`, { stdio: 'ignore' });
      return true;
    }
  } catch {
    return false;
  }
}

function getRunningPid() {
  if (fs.existsSync(PID_FILE)) {
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8'), 10);
    if (isRunning(pid)) {
      return pid;
    }
  }
  return null;
}

function start() {
  const existingPid = getRunningPid();
  if (existingPid) {
    console.log(`服务器已在运行中 (PID: ${existingPid})`);
    return;
  }

  console.log('正在启动服务器...');

  const port = getPort();
  const serverPath = path.join(__dirname, '../server/index.js');

  const child = spawn('node', [serverPath], {
    env: { ...process.env, NODE_ENV: 'production', PORT: port.toString() },
    detached: true,
    stdio: 'ignore',
  });

  fs.writeFileSync(PID_FILE, child.pid.toString());

  console.log(`服务器已启动 (PID: ${child.pid}, 端口：${port})`);
  console.log('访问地址：http://localhost:' + port);
}

function stop() {
  const pid = getRunningPid();
  if (!pid) {
    console.log('服务器未运行');
    return;
  }

  console.log(`正在停止服务器 (PID: ${pid})...`);

  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
    } else {
      execSync(`kill ${pid}`, { stdio: 'ignore' });
    }
    fs.unlinkSync(PID_FILE);
    console.log('服务器已停止');
  } catch (error) {
    console.error('停止失败:', error.message);
  }
}

function restart() {
  stop();
  setTimeout(() => {
    start();
  }, 1000);
}

function status() {
  const pid = getRunningPid();
  if (pid) {
    const port = getPort();
    console.log(`服务器运行中`);
    console.log(`  PID: ${pid}`);
    console.log(`  端口：${port}`);
    console.log(`  访问地址：http://localhost:${port}`);
  } else {
    console.log('服务器未运行');
  }
}

function help() {
  console.log(`
grow-ruler - ALittle 成长尺 CLI 工具

用法：grow-ruler <command>

命令:
  start     启动服务器
  stop      停止服务器
  restart   重启服务器
  status    查看服务器状态
  help      显示此帮助信息

环境变量:
  PORT      服务器端口 (默认：24010)

示例:
  grow-ruler start      # 启动服务
  grow-ruler status     # 查看状态
  grow-ruler stop       # 停止服务
`);
}

const command = process.argv[2] || 'help';

switch (command) {
  case 'start':
    start();
    break;
  case 'stop':
    stop();
    break;
  case 'restart':
    restart();
    break;
  case 'status':
    status();
    break;
  case 'help':
  case '--help':
  case '-h':
    help();
    break;
  default:
    console.error(`未知命令：${command}`);
    console.error('运行 "grow-ruler help" 查看帮助');
    process.exit(1);
}
