import type {
  Template,
  TemplateField,
  TemplateIOColumn,
  TemplateImportConfig,
  TemplateExportConfig,
} from '../database/templates';
import type { DataEntry } from '../database/dataEntries';
import * as XLSX from 'xlsx';

type ImportRow = Record<string, unknown>;

export interface ImportParseResult {
  entries: DataEntry[];
  skipped: number;
  errors: string[];
}

interface ParsedFieldValue {
  value: number | string | null;
  error?: string;
}

function getFieldExample(field: TemplateField): string | number {
  if (field.type === 'number') {
    return 100;
  }
  if (field.type === 'select' && field.options?.length) {
    return field.options[0].label;
  }
  if (field.type === 'date') {
    return '2024-01-01';
  }
  return '示例值';
}

function buildBaseColumns(): TemplateIOColumn[] {
  return [
    {
      key: 'timestamp',
      label: '时间',
      source: 'timestamp',
      aliases: ['timestamp', 'date', '时间', '日期'],
      example: '2024-01-01 08:00',
    },
    {
      key: 'note',
      label: '备注',
      source: 'note',
      aliases: ['note', '备注'],
      example: '示例备注（可选）',
    },
  ];
}

function buildFieldColumns(fields: TemplateField[]): TemplateIOColumn[] {
  return fields.map((field) => ({
    key: field.key,
    label: field.label,
    source: 'field',
    fieldKey: field.key,
    aliases: [field.key, field.label],
    example: getFieldExample(field),
  }));
}

export function buildDefaultImportConfig(template: Template): TemplateImportConfig {
  return {
    columns: [
      ...buildBaseColumns(),
      ...buildFieldColumns(template.fields),
    ],
  };
}

export function buildDefaultExportConfig(template: Template): TemplateExportConfig {
  return {
    columns: [
      ...buildBaseColumns(),
      ...buildFieldColumns(template.fields),
    ],
  };
}

export function enrichTemplate(template: Template): Template {
  return {
    ...template,
    import_config: template.import_config || buildDefaultImportConfig(template),
    export_config: template.export_config || buildDefaultExportConfig(template),
  };
}

export function getColumnHeader(column: TemplateIOColumn): string {
  return `${column.label}(${column.key})`;
}

function getCandidateHeaders(column: TemplateIOColumn): string[] {
  return Array.from(new Set([
    getColumnHeader(column),
    column.key,
    column.label,
    ...(column.aliases || []),
  ]));
}

function getRowValue(row: ImportRow, column: TemplateIOColumn): unknown {
  for (const key of getCandidateHeaders(column)) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      return row[key];
    }
  }

  const suffix = `(${column.key})`;
  const matchingKey = Object.keys(row).find((key) => key === column.key || key.endsWith(suffix));
  if (matchingKey) {
    return row[matchingKey];
  }

  return undefined;
}

function normalizeTimestamp(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'number') {
    return XLSX.SSF.format('yyyy-mm-dd hh:mm', value);
  }

  return String(value).trim();
}

function parseFieldValue(field: TemplateField | undefined, value: unknown): ParsedFieldValue {
  if (value === null || value === undefined) {
    return { value: null };
  }

  const raw = String(value).trim();
  if (!raw) {
    return { value: null };
  }

  if (!field) {
    return { value: raw };
  }

  if (field.type === 'number') {
    if (!/^-?\d+(\.\d+)?$/.test(raw)) {
      return {
        value: null,
        error: `${field.label} 只能填写纯数字，单位由模板固定，不要填写 ${raw}`,
      };
    }

    const parsed = Number(raw);
    return Number.isNaN(parsed)
      ? { value: null, error: `${field.label} 不是有效数字` }
      : { value: parsed };
  }

  if (field.type === 'select') {
    const option = field.options?.find((item) => item.value === raw || item.label === raw);
    return { value: option?.value || raw };
  }

  return { value: raw };
}

export function buildImportTemplateRows(template: Template): Array<Record<string, string | number>> {
  const config = enrichTemplate(template).import_config!;
  const exampleRow: Record<string, string | number> = {};

  for (const column of config.columns) {
    exampleRow[getColumnHeader(column)] = column.example || '';
  }

  return [exampleRow];
}

export function parseImportedRows(
  template: Template,
  rows: ImportRow[],
  recordId: number
): ImportParseResult {
  const normalizedTemplate = enrichTemplate(template);
  const columns = normalizedTemplate.import_config!.columns;
  const fieldMap = new Map(normalizedTemplate.fields.map((field) => [field.key, field]));
  const entries: DataEntry[] = [];
  const errors: string[] = [];
  let skipped = 0;

  rows.forEach((row, index) => {
    const timestampColumn = columns.find((column) => column.source === 'timestamp');
    const noteColumn = columns.find((column) => column.source === 'note');
    const timestamp = normalizeTimestamp(timestampColumn ? getRowValue(row, timestampColumn) : row.timestamp);

    if (!timestamp) {
      skipped += 1;
      return;
    }

    const values: Record<string, number | string | null> = {};
    let rowHasError = false;

    for (const column of columns) {
      if (column.source !== 'field' || !column.fieldKey) {
        continue;
      }

      const field = fieldMap.get(column.fieldKey);
      const parsed = parseFieldValue(field, getRowValue(row, column));

      if (parsed.error) {
        skipped += 1;
        errors.push(`第 ${index + 2} 行: ${parsed.error}`);
        rowHasError = true;
        break;
      }

      if (parsed.value === null) {
        continue;
      }

      values[column.fieldKey] = parsed.value;
    }

    if (rowHasError) {
      return;
    }

    if (
      normalizedTemplate.fields.some((field) => field.required && values[field.key] === undefined)
    ) {
      skipped += 1;
      errors.push(`第 ${index + 2} 行缺少必填字段`);
      return;
    }

    const noteValue = noteColumn ? getRowValue(row, noteColumn) : row.note;
    entries.push({
      record_id: recordId,
      timestamp,
      values,
      note: noteValue ? String(noteValue).trim() : null,
    });
  });

  return { entries, skipped, errors };
}

function formatFieldValue(field: TemplateField | undefined, value: number | string | null | undefined): string | number {
  if (value === null || value === undefined) {
    return '';
  }

  if (field?.type === 'select') {
    const option = field.options?.find((item) => item.value === value);
    return option?.label || String(value);
  }

  return value;
}

export function buildExportRows(
  template: Template,
  entries: DataEntry[]
): Array<Record<string, string | number>> {
  const normalizedTemplate = enrichTemplate(template);
  const columns = normalizedTemplate.export_config!.columns;
  const fieldMap = new Map(normalizedTemplate.fields.map((field) => [field.key, field]));

  return entries.map((entry) => {
    const row: Record<string, string | number> = {};

    for (const column of columns) {
      const header = getColumnHeader(column);
      if (column.source === 'timestamp') {
        row[header] = entry.timestamp;
        continue;
      }
      if (column.source === 'note') {
        row[header] = entry.note || '';
        continue;
      }
      row[header] = formatFieldValue(fieldMap.get(column.fieldKey || ''), entry.values[column.fieldKey || '']);
    }

    return row;
  });
}
