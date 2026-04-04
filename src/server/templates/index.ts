/**
 * 模板加载器
 * 加载内置模板并初始化到数据库
 */

import * as templatesDao from '../database/templates';
import type { Template } from '../database/templates';
import { heightWeightTemplate } from './builtin/heightWeight';
import { pregnancyWeightTemplate } from './builtin/pregnancyWeight';
import { bloodPressureTemplate } from './builtin/bloodPressure';
import { enrichTemplate } from './io';
import { migratePregnancyWeightEntries } from './migrations';

// 所有内置模板
const builtinTemplates: Template[] = [
  heightWeightTemplate,
  pregnancyWeightTemplate,
  bloodPressureTemplate,
];

/**
 * 初始化内置模板到数据库
 */
export function initializeTemplates(): void {
  for (const template of builtinTemplates) {
    templatesDao.upsert(enrichTemplate(template));
  }

  const migrationResult = migratePregnancyWeightEntries();
  if (migrationResult.migrated > 0 || migrationResult.skipped > 0) {
    console.log(
      `孕期体重数据迁移完成：迁移 ${migrationResult.migrated} 条，跳过 ${migrationResult.skipped} 条`
    );
  }
}

/**
 * 获取所有模板
 */
export function getAllTemplates(): Template[] {
  return templatesDao.findAll().map((template) => enrichTemplate(template));
}

/**
 * 根据模板 ID 获取模板
 */
export function getTemplateById(id: string): Template | undefined {
  const template = templatesDao.findById(id);
  return template ? enrichTemplate(template) : undefined;
}

/**
 * 导出模板定义供其他模块使用
 */
export { builtinTemplates };
export type { Template };
