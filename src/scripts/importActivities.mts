import { parse } from "yaml";
import { fs } from "zx";
import { initializeDB, createNode, Node } from "../db.mts";
import { YamlDoc } from "../types.mts";

async function importNodes() {
  try {
    // Initialize the database
    await initializeDB();
    console.log("Database initialized");

    // Read and parse the YAML file
    const file = fs.readFileSync("./state.yml", "utf8");
    const parsed = parse(file, { maxAliasCount: -1 }) as YamlDoc;
    console.log(`Found ${parsed.activities.length} activities in YAML file`);

    // Convert and import each activity
    for (const activity of parsed.activities) {
      try {
        const activityDTO: Node = {
          activityId: activity.activityId,
          orgId: activity.orgId,
          orgText: activity.orgText,
          name: activity.name,
          dwmTag: activity.dwmTag ?? 0,
          created: new Date(activity.created),
          lastAccessed: new Date(activity.lastAccessed),
          active: activity.active,
        };

        await createNode(activityDTO);
        console.log(
          `Imported activity: ${activity.name} (${activity.activityId})`,
        );
      } catch (error) {
        console.error(
          `Error importing activity ${activity.activityId}:`,
          error,
        );
        // Continue with next activity even if one fails
      }
    }

    console.log("Import completed successfully");
  } catch (error) {
    console.error("Import failed:", error);
    process.exit(1);
  }
}

// Run the import
importNodes();
