#!/usr/bin/env node

/**
 * grow-ruler CLI 命令行工具
 * 支持命令：start, stop, restart, status, help
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.resolve(__dirname, '../..');
const PID_FILE = path.join(ROOT_DIR, '.server.pid');
const LOG_FILE = path.join(ROOT_DIR, '.server.log');
const DEFAULT_PORT = 24010;

function getPort(): number {
  const rawPort = process.env.PORT;
  const port = rawPort ? Number(rawPort) : DEFAULT_PORT;

  if (!Number.isInteger(port) || port <= 0) {
    return DEFAULT_PORT;
  }

  return port;
}

function isRunning(pid: number): boolean {
  try {
    if (process.platform === 'win32') {
      execSync(`tasklist /FI "PID eq ${pid}"`, { stdio: 'ignore' });
      return true;
    }

    execSync(`kill -0 ${pid}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function getRunningPid(): number | null {
  if (!fs.existsSync(PID_FILE)) {
    return null;
  }

  const pid = Number(fs.readFileSync(PID_FILE, 'utf-8').trim());
  if (Number.isInteger(pid) && isRunning(pid)) {
    return pid;
  }

  fs.rmSync(PID_FILE, { force: true });
  return null;
}

function getServerEntry(): string {
  return path.join(ROOT_DIR, 'dist/server/index.js');
}

function ensureBuildExists(): void {
  const serverEntry = getServerEntry();
  if (!fs.existsSync(serverEntry)) {
    console.error('未找到生产构建文件，请先执行 npm run build');
    process.exit(1);
  }
}

function start(): void {
  const existingPid = getRunningPid();
  if (existingPid) {
    console.log(`服务器已在运行中 (PID: ${existingPid})`);
    return;
  }

  ensureBuildExists();

  const port = getPort();
  const stdoutFd = fs.openSync(LOG_FILE, 'a');
  const stderrFd = fs.openSync(LOG_FILE, 'a');
  const child = spawn(process.execPath, [getServerEntry()], {
    cwd: ROOT_DIR,
    env: { ...process.env, NODE_ENV: 'production', PORT: String(port) },
    detached: true,
    stdio: ['ignore', stdoutFd, stderrFd],
  });

  let exited = false;
  let exitMessage = '';

  child.once('error', (error) => {
    exited = true;
    exitMessage = error.message;
  });

  child.once('exit', (code, signal) => {
    exited = true;
    exitMessage = `code=${code ?? 'null'}, signal=${signal ?? 'null'}`;
  });

  setTimeout(() => {
    if (exited || !isRunning(child.pid)) {
      fs.rmSync(PID_FILE, { force: true });
      console.error(`服务器启动失败，请检查日志：${LOG_FILE}`);
      if (exitMessage) {
        console.error(`退出信息：${exitMessage}`);
      }
      process.exitCode = 1;
      return;
    }

    fs.writeFileSync(PID_FILE, String(child.pid));
    child.unref();
    console.log(`服务器已启动 (PID: ${child.pid}, 端口：${port})`);
    console.log(`访问地址：http://localhost:${port}`);
    console.log(`日志文件：${LOG_FILE}`);
  }, 800);
}

function stop(): void {
  const pid = getRunningPid();
  if (!pid) {
    console.log('服务器未运行');
    return;
  }

  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
    } else {
      execSync(`kill ${pid}`, { stdio: 'ignore' });
    }

    fs.rmSync(PID_FILE, { force: true });
    console.log(`服务器已停止 (PID: ${pid})`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`停止失败: ${message}`);
    process.exitCode = 1;
  }
}

function restart(): void {
  const pid = getRunningPid();
  if (pid) {
    stop();
  }

  start();
}

function status(): void {
  const pid = getRunningPid();
  if (!pid) {
    console.log('服务器未运行');
    return;
  }

  const port = getPort();
  console.log('服务器运行中');
  console.log(`PID: ${pid}`);
  console.log(`端口：${port}`);
  console.log(`访问地址：http://localhost:${port}`);
  console.log(`日志文件：${LOG_FILE}`);
}

function help(): void {
  console.log(`
grow-ruler - ALittle 成长尺 CLI 工具

用法：grow-ruler <command>

命令:
  start     启动服务器（后台运行）
  stop      停止服务器
  restart   重启服务器
  status    查看服务器状态
  help      显示此帮助信息

环境变量:
  PORT      服务器端口 (默认：24010)

示例:
  grow-ruler start
  grow-ruler status
  grow-ruler restart
  grow-ruler stop
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
