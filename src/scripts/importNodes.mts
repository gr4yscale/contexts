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
    console.log(`Found ${parsed.nodes.length} nodes in YAML file`);

    // Convert and import each node
    for (const node of parsed.nodes) {
      try {
        const nodeDTO: Node = {
          nodeId: node.nodeId,
          orgId: node.orgId,
          orgText: node.orgText,
          name: node.name,
          dwmTag: node.dwmTag ?? 0,
          created: new Date(node.created),
          lastAccessed: new Date(node.lastAccessed),
          active: node.active,
        };

        await createNode(nodeDTO);
        console.log(
          `Imported node: ${node.name} (${node.nodeId})`,
        );
      } catch (error) {
        console.error(
          `Error importing node ${node.nodeId}:`,
          error,
        );
        // Continue with next node even if one fails
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
