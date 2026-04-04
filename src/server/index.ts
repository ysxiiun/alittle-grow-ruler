/**
 * Express 服务器入口文件
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { initializeDatabase, closeDatabase } from './database';
import { initializeTemplates } from './templates';
import rulersRouter from './routes/rulers';
import templatesRouter from './routes/templates';
import recordsRouter from './routes/records';
import analysisRouter from './routes/analysis';

const app = express();
const PORT = process.env.PORT || 31000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API 路由
app.use('/api/templates', templatesRouter);
app.use('/api/rulers', rulersRouter);
app.use('/api/records', recordsRouter);
app.use('/api/analysis', analysisRouter);

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// 生产环境：服务静态文件
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '../client');
  app.use(express.static(clientPath));

  // SPA 路由 fallback
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// 错误处理
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
  });
});

// 启动服务器
let server: ReturnType<typeof app.listen> | null = null;

export function startServer(port: number = Number(PORT)): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // 初始化数据库
      initializeDatabase();
      console.log('数据库初始化成功');

      // 初始化内置模板
      initializeTemplates();
      console.log('模板初始化成功');

      // 启动 HTTP 服务器
      server = app.listen(port, () => {
        console.log(`服务器运行在端口 ${port}`);
        resolve();
      });

      server.on('error', (err) => {
        console.error('服务器启动失败:', err);
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function stopServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (server) {
      server.close((err) => {
        if (err) {
          reject(err);
        } else {
          closeDatabase();
          console.log('服务器已停止');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

// 直接运行时启动服务器
if (process.argv[1]?.endsWith('/server/index.ts') || process.argv[1]?.endsWith('/server/index.js')) {
  startServer().catch(console.error);

  // 优雅关闭
  process.on('SIGINT', async () => {
    await stopServer();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await stopServer();
    process.exit(0);
  });
}
