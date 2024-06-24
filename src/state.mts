import { parse, stringify } from "yaml";
import { fs } from "zx";

export type ActivityId = string;

export type Activity = {
  activityId: ActivityId;
  name: string;
  dwmTag?: number;
  created: Date;
  lastAccessed: Date;
  active: boolean;
  scripts: string[];
  emacsWindowBookmarks: EmacsBookmark[];
  emacsOrgBookmarks: EmacsBookmark[];
  tags: string[];
  //sticky: boolean; use tag?
  parentActivityId?: string;
  linkGroups: LinkGroup[];
  links: Link[];
};

export type Link = {
  id: string;
  url: string;
  title: string;
  description?: string;
  created: Date;
  accessed: Date;
  sticky: boolean;
};

export type LinkGroup = {
  id: string;
  name: string; // default to created time, plus details of parent activity?
  description?: string;
  created: Date;
  accessed: Date;
  links: Link[];
};

export type EmacsBookmark = {
  id: string;
  title: string;
  env: string;
  url?: string;
  created: Date;
  accessed: Date;
  sticky: boolean;
};

export type YamlDoc = {
  activities: Activity[];
  currentActivityId: ActivityId;
  previousActivityId: ActivityId;
};

let activities: Activity[] = [];
let currentActivity: Activity;
let previousActivity: Activity;

const dwmTags = new Array<ActivityId>(32); // dwm uses a bitmask to store what "tags" a window (client) is visible on

export const activityById = (id: ActivityId) =>
  activities.find((c) => c.activityId === id);

export const getState = () => {
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
    const parsed = parse(file) as YamlDoc;

    activities = parsed.activities.map((c) => {
      c.created = new Date(c.created)
      c.lastAccessed = new Date(c.lastAccessed)
 
      c.emacsWindowBookmarks = c.emacsWindowBookmarks ?? []
      c.emacsWindowBookmarks = c.emacsWindowBookmarks.map((bm) => {
	bm.created = new Date(bm.created)
	bm.accessed = new Date(bm.accessed)
	return bm
      })

      c.emacsOrgBookmarks = c.emacsOrgBookmarks ?? []
      c.emacsOrgBookmarks = c.emacsOrgBookmarks.map((bm) => {
	bm.created = new Date(bm.created)
	bm.accessed = new Date(bm.accessed)
	return bm
      })

      c.linkGroups = c.linkGroups ?? []
      c.linkGroups = c.linkGroups.map((lg) => {
	lg.created= new Date(lg.created)
	lg.accessed = new Date(lg.accessed)
	lg.links = lg.links ?? []
	lg.links = lg.links.map((l) => {
	  l.created = new Date(l.created)
	  l.accessed= new Date(l.accessed)
	  return l
	})
	return lg
      })
      c.links = c.links ?? []

      return c;
    });

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
      console.error("expected to find current activity");
    }

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
    activities,
  };

  const stringified = stringify(state);
  //TOFIX
  // https://joeattardi.dev/customizing-jsonparse-and-jsonstringify#heading-adding-a-reviver-function
  fs.writeFileSync("./activities.yml", stringified);
};

export const createActivity = (id: ActivityId) => {
  console.log(`creating activity: ${id}`);
  const activity = {
    activityId: id,
    name: id,
    created: new Date(),
    lastAccessed: new Date(),
    active: false,
    scripts: [],
    emacsWindowBookmarks: [],
    emacsOrgBookmarks: [],
    tags: [],
    linkGroups: [],
    links: [],
  };
  activities.push(activity);
  return activity;
};

// todo replace with a stack
export const updateCurrentActivity = (activity: Activity) => {
  currentActivity = activity;
};

export const updatePreviousActivity = (activity: Activity) => {
  previousActivity = activity;
};

export const activitiesActive = () => activities.filter((c) => c.active === true);
