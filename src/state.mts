import { parse, stringify } from "yaml";
import { fs } from "zx";

export type ActivityId = string;

export type Activity = {
  activityId: ActivityId;
  orgId: string;
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
};

// export type Mode = {
//   id: string;
//   title: string;
//   created: Date;
//   accessed: Date;
// };

export type Tag = string

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
  enabledTags: Tag[];
  currentActivityId: ActivityId;
  previousActivityId: ActivityId;
  //dwmTags: ActivityId[]; 
};

export enum ActivityListType {
  All = "all",
  Active = "active",
  EnabledTags = "enabledTags",
  OrgIds = "orgIds"
  // selected,
  // transient,
  // recent?
}

type ActivityListBuilder = (activities: Activity[]) => Activity[]

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


enabledActivityListTypes.push(ActivityListType.Active)

export const getState = () => {
  return {
    activities,
    enabledActivityListTypes,
    currentActivity,
    previousActivity,
    dwmTags,
    enabledTags
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

    enabledTags = parsed.enabledTags

    //dwmTags.concat(dwmTags)
    
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
    activities
  };

  const stringified = stringify(state);
  //TOFIX
  // https://joeattardi.dev/customizing-jsonparse-and-jsonstringify#heading-adding-a-reviver-function
  fs.writeFileSync("./state.yml", stringified);
};

export const createActivity = (id: ActivityId) => {
  console.log(`creating activity: ${id}`);
  const activity: Activity = {
    activityId: id,
    name: id,
    orgId: '',
    orgText: '',
    created: new Date(),
    lastAccessed: new Date(),
    active: false,
    scripts: [],
    emacsWindowBookmarks: [],
    emacsOrgBookmarks: [],
    tags: [],
    linkGroups: [],
    links: []
  };
  activities.push(activity);
  return activity;
};

// convenient keybinding for emacs activity activation in agenda and org-mode buffers
// make name include the orgId
// deactivate for orgId

// convenient keybinding for searching current buffer
// prune activities

export const createActivityForOrgId = (id: ActivityId, orgId: string, orgText: string) => {
  const activity = createActivity(id)
  activity.orgId = orgId
  activity.orgText = orgText
  activity.name = orgText
  activity.tags.push('orgTask')
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
    enabledTags.push(t)
  }
}

// todo replace with a stack
export const updateCurrentActivity = (activity: Activity) => {
  currentActivity = activity;
};

export const updatePreviousActivity = (activity: Activity) => {
  previousActivity = activity;
};



// activities lists

export const activitiesAll = (a: Activity[]) => a

export const activitiesActive = (a: Activity[]) => a.filter((c) => c.active === true);

export const activitiesEnabledTags = (activities: Activity[]) => {
  const filtered = new Set<Activity>()
  enabledTags.forEach((t) => {
    const matches = activities.filter((a) => a.tags.includes(t))
    matches.forEach((m) => filtered.add(m))
  })
  return Array.from(filtered)
}

export const activitiesOrgIds = (activities: Activity[]) => {
  return activities.filter((a) => a.tags.includes('orgTask'))
}

const activityListBuilders: Record<ActivityListType, ActivityListBuilder> = {
  [ActivityListType.All]: activitiesAll,
  [ActivityListType.Active]: activitiesActive,
  [ActivityListType.EnabledTags]: activitiesEnabledTags,
  [ActivityListType.OrgIds]: activitiesOrgIds,
};

export const buildActivityList = (listTypes: ActivityListType[], activities: Activity[]) => {
  const combined = new Set<Activity>()
  for (const listType of listTypes) {
    const build = activityListBuilders[listType];
    const list = build(activities)
    list.forEach((e)=> combined.add(e))
  }
  return Array.from(combined)
}

// tofix: dealing with an array of enumeration values rather than strings here
export const toggleActivityListTypeEnabled = (l: ActivityListType) => {
  if (enabledActivityListTypes.includes(l)) {
    const index = enabledActivityListTypes.indexOf(l);
    if (~index) enabledActivityListTypes.splice(index, 1);
  } else {
    enabledActivityListTypes.push(l)
  }
}
