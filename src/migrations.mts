import { promises as fs } from "fs";
import path from "path";
import { getConnection } from "./db.mts";

interface Migration {
  id: number;
  name: string;
  upSql: string;
  downSql: string;
}

interface MigrationOptions {
  direction?: "up" | "down";
  target?: number;
}

const isIntegrationTest = process.env.RUN_INTEGRATION_TESTS === "true";

export async function runMigrations(
  options: MigrationOptions = {},
): Promise<void> {
  const direction = options.direction || "up";
  const connection = await getConnection();

  // Get applied migrations
  const result = await connection.query(
    `SELECT id, name FROM migrations ORDER BY id`,
  );
  const appliedMigrations = new Map(
    result.rows.map((row: any) => [row.id, row.name]),
  );

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
      const content = await fs.readFile(path.join(migrationsDir, file), "utf8");

      // Split content into up and down migrations
      const upDownSplit = content.split(/^--\s*down\s*$/im);

      if (upDownSplit.length < 2) {
        console.warn(`Migration ${id} doesn't have a DOWN section. Skipping.`);
        continue;
      }

      // Remove any "-- up" marker from the up SQL if present
      const upSql = upDownSplit[0].replace(/^--\s*up\s*$/im, "").trim();
      const downSql = upDownSplit[1].trim();

      migrations.push({ id, name, upSql, downSql });
    }

    // Sort migrations by ID
    migrations.sort((a, b) => a.id - b.id);

    if (direction === "up") {
      // Apply pending migrations up to target (or all if target not specified)
      for (const migration of migrations) {
        if (options.target !== undefined && migration.id > options.target) {
          break;
        }

        if (!appliedMigrations.has(migration.id)) {
          if (!isIntegrationTest) {
            console.log(
              `Applying migration ${migration.id}: ${migration.name}`,
            );
          }

          // Run the migration in a transaction
          await connection.query("BEGIN");
          try {
            await connection.query(migration.upSql);
            await connection.query(
              `INSERT INTO migrations (id, name) VALUES ($1, $2)`,
              [migration.id, migration.name],
            );
            await connection.query("COMMIT");
            if (!isIntegrationTest) {
              console.log(`Migration ${migration.id} applied successfully`);
            }
          } catch (error) {
            await connection.query("ROLLBACK");
            console.error(`Error applying migration ${migration.id}:`, error);
            throw error;
          }
        }
      }
    } else {
      // Roll back migrations down to target (or all if target not specified)
      // Get all applied migrations in reverse order
      const appliedMigrationIds = Array.from(appliedMigrations.keys()).sort(
        (a, b) => b - a,
      );

      for (const id of appliedMigrationIds) {
        // If target is specified and we've reached or gone below it, stop
        if (options.target !== undefined && id <= options.target) {
          break;
        }

        // Find the migration object
        const migration = migrations.find((m) => m.id === id);
        if (!migration) {
          console.warn(`Cannot find migration with ID ${id} to roll back`);
          continue;
        }

        console.log(`Rolling back migration ${id}: ${migration.name}`);

        // Run the down migration in a transaction
        await connection.query("BEGIN");
        try {
          await connection.query(migration.downSql);
          await connection.query(`DELETE FROM migrations WHERE id = $1`, [id]);
          await connection.query("COMMIT");
          console.log(`Migration ${id} rolled back successfully`);
        } catch (error) {
          await connection.query("ROLLBACK");
          console.error(`Error rolling back migration ${id}:`, error);
          throw error;
        }
      }
    }

    console.log(
      `All migrations ${
        direction === "up" ? "applied" : "rolled back"
      } successfully`,
    );
  } catch (error) {
    console.error("Error running migrations:", error);
    throw error;
  }
}
