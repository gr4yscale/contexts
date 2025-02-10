import { parse, stringify } from "yaml";
import { fs } from "zx";
import { ActivityId, YamlDoc, State } from "./types.mts";
import { createActivitiesList, activityById } from "./activityList.mts";

let { activities, currentActivity, previousActivity } = createActivitiesList();

const dwmTags = new Array<ActivityId>(32); // dwm uses a bitmask to store what "tags" a window (client) is visible on

export const getState = (): State => {
  return {
    activities,
    currentActivity,
    previousActivity,
    dwmTags,
  };
};

export const loadState = async () => {
  try {
    const file = fs.readFileSync("./state.yml", "utf8");
    const parsed = parse(file, { maxAliasCount: -1 }) as YamlDoc;

    activities = parsed.activities.map((c) => {
      c.created = new Date(c.created);
      c.lastAccessed = new Date(c.lastAccessed);

      c.emacsWindowBookmarks = c.emacsWindowBookmarks ?? [];
      c.emacsWindowBookmarks = c.emacsWindowBookmarks.map((bm) => {
        bm.created = new Date(bm.created);
        bm.accessed = new Date(bm.accessed);
        return bm;
      });

      c.emacsOrgBookmarks = c.emacsOrgBookmarks ?? [];
      c.emacsOrgBookmarks = c.emacsOrgBookmarks.map((bm) => {
        bm.created = new Date(bm.created);
        bm.accessed = new Date(bm.accessed);
        return bm;
      });

      c.linkGroups = c.linkGroups ?? [];
      c.linkGroups = c.linkGroups.map((lg) => {
        lg.created = new Date(lg.created);
        lg.accessed = new Date(lg.accessed);
        lg.links = lg.links ?? [];
        lg.links = lg.links.map((l) => {
          l.created = new Date(l.created);
          l.accessed = new Date(l.accessed);
          return l;
        });
        return lg;
      });
      c.links = c.links ?? [];

      c.actions = c.actions ?? [];

      c.browserStates = c.browserStates.slice(-3) ?? [];
      c.browserStates = c.browserStates.map((bs) => {
        bs.created = new Date(bs.created);
        bs.accessed = new Date(bs.accessed);
        return bs;
      });

      return c;
    });

    //enabledTags = parsed.enabledTags;

    // todo: fix hacks
    const current = activityById(parsed.currentActivityId);
    if (current) {
      currentActivity = current;
    } else {
      console.error("expected to find current activity");
    }

    const previous = activityById(parsed.previousActivityId);
    if (previous) {
      previousActivity = previous;
    } else {
      console.error("expected to find previous activity");
    }

    // actions should be loaded and stored

    return { currentActivity, previousActivity, activities };
  } catch (e) {
    console.error("Error occured while loading state from YAML");
    console.error(e);
  }
};

export const storeState = () => {
  const state: YamlDoc = {
    currentActivityId: currentActivity.activityId,
    previousActivityId: previousActivity.activityId,
    //dwmTags,
    activities,
  };

  // https://joeattardi.dev/customizing-jsonparse-and-jsonstringify#heading-adding-a-reviver-function

  // const stringified = stringify(state, (key, value) =>
  //   key === "actions" ? [] : value,
  // );

  const stringified = stringify(state);
  fs.writeFileSync("./state.yml", stringified);
};
