import { getDatabase } from '../database';

interface MigrationStats {
  migrated: number;
  skipped: number;
}

function inferPregnancyWeightPeriod(timestamp: string): 'morning' | 'night' | null {
  const hour = Number(timestamp.slice(11, 13));
  if (hour >= 4 && hour <= 10) {
    return 'morning';
  }
  if (hour >= 18 && hour <= 23) {
    return 'night';
  }
  return null;
}

export function migratePregnancyWeightEntries(): MigrationStats {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT de.id, de.timestamp, de."values"
    FROM data_entries de
    INNER JOIN records r ON r.id = de.record_id
    WHERE r.template_id = 'pregnancy-weight'
      AND r.is_deleted = 0
    ORDER BY de.id ASC
  `).all() as Array<{
    id: number;
    timestamp: string;
    values: string;
  }>;

  const updateStmt = db.prepare(`
    UPDATE data_entries
    SET "values" = ?
    WHERE id = ?
  `);

  const migrate = db.transaction((items: typeof rows) => {
    let migrated = 0;
    let skipped = 0;

    for (const row of items) {
      const values = JSON.parse(row.values || '{}') as Record<string, unknown>;

      if (values.weight_period === 'morning' || values.weight_period === 'night') {
        continue;
      }

      const inferred = inferPregnancyWeightPeriod(row.timestamp);
      if (!inferred) {
        skipped += 1;
        continue;
      }

      values.weight_period = inferred;
      updateStmt.run(JSON.stringify(values), row.id);
      migrated += 1;
    }

    return { migrated, skipped };
  });

  return migrate(rows);
}
