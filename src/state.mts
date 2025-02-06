import { parse, stringify } from "yaml";
import { fs } from "zx";
import { ActivityListType } from "./activityList.mts";
import { BrowserState } from "./browser.mts";

export type ActivityId = string;
export type ContextId = string;
export type OrgId = string;


export type Context = {
  contextId: ContextId;
  name: string;
  created: Date;
  accessed: Date;

  actions?: string[]; // global actions?

  activityIds: ActivityId[];
  orgIds: OrgId[]; // IDs to toggle outside of query
  orgQueries?: string[]; // UI to select-to-view org headlines and queries for context

  resources?: string[]; // instead of breaking them into differnt fields
};
export type Activity = {
  activityId: ActivityId;
  orgId: OrgId;
  orgText: string;
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
  actions: string[];
  browserStates: BrowserState[];
};

export type Tag = string;

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
  contexts: Context[];
  currentContextId: ContextId;
  activities: Activity[];
  enabledTags: Tag[];
  currentActivityId: ActivityId;
  previousActivityId: ActivityId;
  //dwmTags: ActivityId[];
};


let currentContext: Context = {
  contextId: "default",
  name: "default",
  created: new Date(),
  accessed: new Date(),
  activityIds: ["home", "emacs-config"],
  orgIds: ["20bc22d6-f5c7-4058-a3ae-2d1f390f9ee7"],
};

let contexts: Context[] = [];
let activities: Activity[] = [];
let currentActivity: Activity;
let previousActivity: Activity;

let enabledActivityListTypes: ActivityListType[] = [];
let enabledTags: Tag[] = [];

const dwmTags = new Array<ActivityId>(32); // dwm uses a bitmask to store what "tags" a window (client) is visible on

export const activityById = (id: ActivityId) =>
  activities.find((c) => c.activityId === id);

export const activityByOrgId = (orgId: string) =>
  activities.find((c) => c.orgId === orgId);


enabledActivityListTypes.push(ActivityListType.Active);

export const getState = () => {
  return {
    currentContext,
    contexts,
    activities,
    enabledActivityListTypes,
    currentActivity,
    previousActivity,
    dwmTags,
    enabledTags,
  };
};

export const loadState = async () => {
  try {
    const file = fs.readFileSync("./state.yml", "utf8");
    const parsed = parse(file, { maxAliasCount: -1 }) as YamlDoc;
    contexts = parsed.contexts.map((c) => {
      c.created = new Date(c.created);
      c.accessed = new Date(c.accessed);
      return c;
    });

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

    enabledTags = parsed.enabledTags;

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

    return { currentActivity, previousActivity, activities, enabledTags };
  } catch (e) {
    console.error("Error occured while oading state from YAML");
    console.error(e);
  }
};

export const storeState = () => {
  const state: YamlDoc = {
    currentActivityId: currentActivity.activityId,
    previousActivityId: previousActivity.activityId,
    //dwmTags,
    enabledTags,
    //enabledActivityListTypes,
    activities,
    contexts,
    currentContextId: currentContext.contextId,
  };

  // https://joeattardi.dev/customizing-jsonparse-and-jsonstringify#heading-adding-a-reviver-function

  // const stringified = stringify(state, (key, value) =>
  //   key === "actions" ? [] : value,
  // );

  const stringified = stringify(state);
  fs.writeFileSync("./state.yml", stringified);
};

export const createActivity = (id: ActivityId) => {
  console.log(`creating activity: ${id}`);
  const activity: Activity = {
    activityId: id,
    name: id,
    orgId: "",
    orgText: "",
    created: new Date(),
    lastAccessed: new Date(),
    active: false,
    scripts: [],
    emacsWindowBookmarks: [],
    emacsOrgBookmarks: [],
    tags: [],
    linkGroups: [],
    links: [],
    actions: [],
    browserStates: [],
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
  activity.tags.push("orgTask");
  return activity;
};

export const filteredActivities = () => {
  return activities;
};

// TODO: needs memoization
export const availableTags = () => {
  return new Set<Tag>(activities.flatMap((a) => a.tags));
};

export const toggleTagEnabled = (t: string) => {
  if (enabledTags.includes(t)) {
    const index = enabledTags.indexOf(t);
    if (~index) enabledTags.splice(index, 1);
  } else {
    enabledTags.push(t);
  }
};

// todo replace with a stack
export const updateCurrentActivity = (activity: Activity) => {
  currentActivity = activity;
};

export const updatePreviousActivity = (activity: Activity) => {
  previousActivity = activity;
};

// tofix: dealing with an array of enumeration values rather than strings here
export const toggleActivityListTypeEnabled = (l: ActivityListType) => {
  if (enabledActivityListTypes.includes(l)) {
    const index = enabledActivityListTypes.indexOf(l);
    if (~index) enabledActivityListTypes.splice(index, 1);
  } else {
    enabledActivityListTypes.push(l);
  }
};

// contexts

export const createContext = (id: ContextId, name: string) => {
  const context: Context = {
    contextId: id,
    name,
    created: new Date(),
    accessed: new Date(),
    activityIds: [],
    orgIds: [],
  };
  contexts.push(context);
  return context;
};


