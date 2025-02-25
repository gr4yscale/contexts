#!/usr/bin/env tsx

import { initializeDB } from "../db.mts";
import { runMigrations } from "../migrations.mts";

async function main() {
  try {
    await initializeDB();

    const direction = process.argv[2] === "down" ? "down" : "up";
    const target = process.argv[3] ? parseInt(process.argv[3], 10) : undefined;

    console.log(
      `Running migrations ${direction}${
        target !== undefined ? ` to target ${target}` : ""
      }`,
    );
    await runMigrations({ direction, target });

    console.log("Migrations completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
}

main();
