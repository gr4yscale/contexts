import { promises as fs } from "fs";
import path from "path";
import { getConnection } from "./db.mts";

interface Migration {
  id: number;
  name: string;
  sql: string;
}

export async function runMigrations(): Promise<void> {
  const connection = await getConnection();

  // Get applied migrations
  const result = await connection.query(
    `SELECT id FROM migrations ORDER BY id`,
  );
  const appliedMigrations = new Set(result.map((row: any) => row.id));

  // Load migration files
  const migrationsDir = path.join(process.cwd(), "migrations");
  try {
    await fs.mkdir(migrationsDir, { recursive: true });
    const files = await fs.readdir(migrationsDir);

    // Parse migration files (expected format: 001_migration_name.sql)
    const migrations: Migration[] = [];
    for (const file of files) {
      if (!file.endsWith(".sql")) continue;

      const match = file.match(/^(\d+)_(.+)\.sql$/);
      if (!match) continue;

      const id = parseInt(match[1], 10);
      const name = match[2];
      const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");

      migrations.push({ id, name, sql });
    }

    // Sort migrations by ID
    migrations.sort((a, b) => a.id - b.id);

    // Apply pending migrations
    for (const migration of migrations) {
      if (!appliedMigrations.has(migration.id)) {
        console.log(`Applying migration ${migration.id}: ${migration.name}`);

        // Run the migration in a transaction
        await connection.run("BEGIN TRANSACTION");
        try {
          await connection.run(migration.sql);
          await connection.run(
            `INSERT INTO migrations (id, name) VALUES (?, ?)`,
            [migration.id, migration.name],
          );
          await connection.run("COMMIT");
          console.log(`Migration ${migration.id} applied successfully`);
        } catch (error) {
          await connection.run("ROLLBACK");
          console.error(`Error applying migration ${migration.id}:`, error);
          throw error;
        }
      }
    }

    console.log("All migrations applied successfully");
  } catch (error) {
    console.error("Error running migrations:", error);
    throw error;
  }
}
