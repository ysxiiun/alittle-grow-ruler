import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

for (const target of ['server', 'cli']) {
  fs.rmSync(path.join(distDir, target), { recursive: true, force: true });
}

await build({
  entryPoints: {
    'server/index': path.join(rootDir, 'src/server/index.ts'),
    'cli/index': path.join(rootDir, 'src/cli/index.ts'),
  },
  outdir: distDir,
  outbase: path.join(rootDir, 'src'),
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  bundle: true,
  packages: 'external',
  sourcemap: true,
  logLevel: 'info',
});
