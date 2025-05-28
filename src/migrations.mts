import { promises as fs } from "fs";
import path from "path";
import { getConnection } from "./db.mts";
import * as logger from "./logger.mts";

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

  logger.debug(`[DEBUG] Starting migrations with direction: ${direction}, target: ${options.target || 'none'}`);

  // Get applied migrations
  logger.debug(`[DEBUG] Querying applied migrations from database`);
  const result = await connection.query(
    `SELECT id, name FROM migrations ORDER BY id`,
  );
  const appliedMigrations = new Map(
    result.rows.map((row: any) => [row.id, row.name]),
  );
  logger.debug(`[DEBUG] Found ${appliedMigrations.size} applied migrations:`, Array.from(appliedMigrations.keys()));

  // Load migration files
  const migrationsDir = path.join(process.cwd(), "migrations");
  logger.debug(`[DEBUG] Loading migration files from: ${migrationsDir}`);
  try {
    await fs.mkdir(migrationsDir, { recursive: true });
    const files = await fs.readdir(migrationsDir);
    logger.debug(`[DEBUG] Found ${files.length} files in migrations directory:`, files);

    // Parse migration files (expected format: 001_migration_name.sql)
    const migrations: Migration[] = [];
    for (const file of files) {
      if (!file.endsWith(".sql")) continue;

      const match = file.match(/^(\d+)_(.+)\.sql$/);
      if (!match) continue;

      const id = parseInt(match[1], 10);
      const name = match[2];
      logger.debug(`[DEBUG] Parsing migration file: ${file} (ID: ${id}, Name: ${name})`);
      
      const content = await fs.readFile(path.join(migrationsDir, file), "utf8");
      logger.debug(`[DEBUG] Read ${content.length} characters from ${file}`);

      // Split content into up and down migrations
      const upDownSplit = content.split(/^--\s*down\s*$/im);

      if (upDownSplit.length < 2) {
        logger.warn(`Migration ${id} doesn't have a DOWN section. Skipping.`);
        continue;
      }

      // Remove any "-- up" marker from the up SQL if present
      const upSql = upDownSplit[0].replace(/^--\s*up\s*$/im, "").trim();
      const downSql = upDownSplit[1].trim();

      migrations.push({ id, name, upSql, downSql });
    }

    // Sort migrations by ID
    migrations.sort((a, b) => a.id - b.id);
    logger.debug(`[DEBUG] Loaded ${migrations.length} valid migrations:`, migrations.map(m => `${m.id}:${m.name}`));

    if (direction === "up") {
      logger.debug(`[DEBUG] Running UP migrations`);
      // Apply pending migrations up to target (or all if target not specified)
      for (const migration of migrations) {
        if (options.target !== undefined && migration.id > options.target) {
          break;
        }

        if (!appliedMigrations.has(migration.id)) {
          if (!isIntegrationTest) {
            logger.debug(
              `Applying migration ${migration.id}: ${migration.name}`,
            );
          }
          logger.debug(`[DEBUG] Executing UP migration ${migration.id} in transaction`);

          // Run the migration in a transaction
          await connection.query("BEGIN");
          try {
            logger.debug(`[DEBUG] Executing UP SQL for migration ${migration.id}`);
            await connection.query(migration.upSql);
            logger.debug(`[DEBUG] Recording migration ${migration.id} in migrations table`);
            await connection.query(
              `INSERT INTO migrations (id, name) VALUES ($1, $2)`,
              [migration.id, migration.name],
            );
            await connection.query("COMMIT");
            logger.debug(`[DEBUG] Transaction committed for migration ${migration.id}`);
            if (!isIntegrationTest) {
              logger.debug(`Migration ${migration.id} applied successfully`);
            }
          } catch (error) {
            logger.debug(`[DEBUG] Rolling back transaction for migration ${migration.id} due to error`);
            await connection.query("ROLLBACK");
            logger.error(`Error applying migration ${migration.id}:`, error);
            throw error;
          }
        } else {
          logger.debug(`[DEBUG] Skipping already applied migration ${migration.id}`);
        }
      }
    } else {
      logger.debug(`[DEBUG] Running DOWN migrations`);
      // Roll back migrations down to target (or all if target not specified)
      // Get all applied migrations in reverse order
      const appliedMigrationIds = Array.from(appliedMigrations.keys()).sort(
        (a, b) => b - a,
      );
      logger.debug(`[DEBUG] Applied migrations in reverse order:`, appliedMigrationIds);

      for (const id of appliedMigrationIds) {
        // If target is specified and we've reached or gone below it, stop
        if (options.target !== undefined && id <= options.target) {
          logger.debug(`[DEBUG] Stopping at migration ${id} due to target ${options.target}`);
          break;
        }

        // Find the migration object
        const migration = migrations.find((m) => m.id === id);
        if (!migration) {
          logger.warn(`Cannot find migration with ID ${id} to roll back`);
          continue;
        }

        logger.debug(`Rolling back migration ${id}: ${migration.name}`);
        logger.debug(`[DEBUG] Executing DOWN migration ${id} in transaction`);

        // Run the down migration in a transaction
        await connection.query("BEGIN");
        try {
          logger.debug(`[DEBUG] Executing DOWN SQL for migration ${id}`);
          await connection.query(migration.downSql);
          logger.debug(`[DEBUG] Removing migration ${id} from migrations table`);
          await connection.query(`DELETE FROM migrations WHERE id = $1`, [id]);
          await connection.query("COMMIT");
          logger.debug(`[DEBUG] Transaction committed for rollback of migration ${id}`);
          logger.debug(`Migration ${id} rolled back successfully`);
        } catch (error) {
          logger.debug(`[DEBUG] Rolling back transaction for migration ${id} due to error`);
          await connection.query("ROLLBACK");
          logger.error(`Error rolling back migration ${id}:`, error);
          throw error;
        }
      }
    }

    logger.debug(
      `All migrations ${
        direction === "up" ? "applied" : "rolled back"
      } successfully`,
    );
    logger.debug(`[DEBUG] Migration process completed`);
  } catch (error) {
    logger.error("Error running migrations:", error);
    logger.debug(`[DEBUG] Migration process failed with error:`, error);
    throw error;
  }
}
