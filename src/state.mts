import { parse, stringify } from "yaml";
import { fs } from "zx";
import { Activity, ActivityId, YamlDoc, State } from "./types.mts";
import { updateActivityState } from "./db.mts";

/**
 *  Activity list
 */
let activities: Activity[] = [];

/**
 *  DWM "Workspaces" (tags)
 */

const dwmTags = new Array<ActivityId>(32); // dwm uses a bitmask to store what "tags" a window (client) is visible on

export const getState = async (): State => {
  return {
    activities,
    dwmTags,
  };
};

export const loadState = async () => {
  try {
    //const file = fs.readFileSync("./state.yml", "utf8");
    //const parsed = parse(file, { maxAliasCount: -1 }) as YamlDoc;

    // activities = parsed.activities.map((c) => {
    //   c.created = new Date(c.created);
    //   c.lastAccessed = new Date(c.lastAccessed);

    //   c.emacsWindowBookmarks = c.emacsWindowBookmarks ?? [];
    //   c.emacsWindowBookmarks = c.emacsWindowBookmarks.map((bm) => {
    //     bm.created = new Date(bm.created);
    //     bm.accessed = new Date(bm.accessed);
    //     return bm;
    //   });

    //   c.emacsOrgBookmarks = c.emacsOrgBookmarks ?? [];
    //   c.emacsOrgBookmarks = c.emacsOrgBookmarks.map((bm) => {
    //     bm.created = new Date(bm.created);
    //     bm.accessed = new Date(bm.accessed);
    //     return bm;
    //   });

    //   c.linkGroups = c.linkGroups ?? [];
    //   c.linkGroups = c.linkGroups.map((lg) => {
    //     lg.created = new Date(lg.created);
    //     lg.accessed = new Date(lg.accessed);
    //     lg.links = lg.links ?? [];
    //     lg.links = lg.links.map((l) => {
    //       l.created = new Date(l.created);
    //       l.accessed = new Date(l.accessed);
    //       return l;
    //     });
    //     return lg;
    //   });
    //   c.links = c.links ?? [];

    //   c.actions = c.actions ?? [];

    //   c.browserStates = c.browserStates.slice(-3) ?? [];
    //   c.browserStates = c.browserStates.map((bs) => {
    //     bs.created = new Date(bs.created);
    //     bs.accessed = new Date(bs.accessed);
    //     return bs;
    //   });

    //   return c;
    // });

    return { activities };
  } catch (e) {
    console.error("Error occured while loading state from YAML");
    console.error(e);
  }
};

export const storeState = () => {
  const state: YamlDoc = {
    //currentActivityId: currentActivity.activityId,
    //previousActivityId: previousActivity.activityId,
    //dwmTags,
    activities,
  };

  const stringified = stringify(state);
  fs.writeFileSync("./state.yml", stringified);
};

/**
 *  Activity helpers
 */

export const activityById = (id: ActivityId) =>
  activities.find((c) => c.activityId === id);

export const activityByOrgId = (orgId: string) =>
  activities.find((c) => c.orgId === orgId);

export const activityByDwmTag = (dwmTag: number) =>
  activities.find((c) => c.dwmTag === dwmTag);

/**
 *  Activity mutations
 */

export const createActivity = (id: ActivityId) => {
  const activity: Activity = {
    activityId: id,
    name: id,
    orgId: "",
    orgText: "",
    created: new Date(),
    lastAccessed: new Date(),
    active: false,
    // scripts: [],
    // emacsWindowBookmarks: [],
    // emacsOrgBookmarks: [],
    // tags: [],
    // linkGroups: [],
    // links: [],
    // actions: [],
    // browserStates: [],
  };
  activities.push(activity);
  return activity;
};

// convenient keybinding for emacs activity activation in agenda and org-mode buffers
// make name include the orgId
// deactivate for orgId

// convenient keybinding for searching current buffer
// prune activities

export const createActivityForOrgId = (
  id: ActivityId,
  orgId: string,
  orgText: string,
) => {
  const activity = createActivity(id);
  activity.orgId = orgId;
  activity.orgText = orgText;
  activity.name = orgText;
  //TOFIX
  //activity.tags.push("orgTask");
  return activity;
};

// todo replace with a stack
export const updateCurrentActivity = (activity: Activity) => {
  updateActivityState(activity.activityId, "something");
};

export const updatePreviousActivity = (activity: Activity) => {
  updateActivityState("something", activity.activityId);
};
