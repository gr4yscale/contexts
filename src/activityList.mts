import { Activity, Tag } from "./types.mts";

import { formatDistanceToNow } from "date-fns";
import { getState } from "./state.mts";

/**
 *  Activity List types
 */

export enum ActivityListType {
  All = "all",
  Active = "active",
  EnabledTags = "enabledTags",
  OrgIds = "orgIds",
  Persistent = "persistent",
  // selected,
  // transient,
  // recent?
}

export const toggleActivityListTypeEnabled = (l: ActivityListType) => {
  if (enabledActivityListTypes.includes(l)) {
    const index = enabledActivityListTypes.indexOf(l);
    if (~index) enabledActivityListTypes.splice(index, 1);
  } else {
    enabledActivityListTypes.push(l);
  }
};

export const menuActivityListTypesToggle = () => {
  const activityListTypes = Object.values(ActivityListType);

  return activityListTypes.map((l) => {
    let marker = enabledActivityListTypes.includes(l) ? "*" : "";
    const withMarker = l + marker;
    const display = `${withMarker.padEnd(80, " ")}`;

    return {
      display,
      handler: async (_?: number) => {
        toggleActivityListTypeEnabled(l);
      },
    };
  });
};

export let enabledActivityListTypes: ActivityListType[] = [];
enabledActivityListTypes.push(ActivityListType.Active);

/**
 *  Activity List type filters
 */

export const activitiesAll = (a: Activity[]) => a;

export const activitiesActive = (a: Activity[]) =>
  a.filter((c) => c.active === true);

export const activitiesEnabledTags = (activities: Activity[]) => {
  const filtered = new Set<Activity>();
  enabledTags.forEach((t) => {
    const matches = activities.filter((a) => a.tags.includes(t));
    matches.forEach((m) => filtered.add(m));
  });
  return Array.from(filtered);
};

export const activitiesPersistent = (activities: Activity[]) => {
  return activities.filter((a) => a.tags.includes("sticky"));
};

export const activitiesOrgIds = (activities: Activity[]) => {
  return activities.filter((a) => a.tags.includes("orgTask"));
};

/**
 *  Activity List Builders
 */

type ActivityListBuilder = (activities: Activity[]) => Activity[];

const activityListBuilders: Record<ActivityListType, ActivityListBuilder> = {
  [ActivityListType.All]: activitiesAll,
  [ActivityListType.Active]: activitiesActive,
  [ActivityListType.EnabledTags]: activitiesEnabledTags,
  [ActivityListType.OrgIds]: activitiesOrgIds,
  [ActivityListType.Persistent]: activitiesPersistent,
};

export const buildActivityList = (
  listTypes: ActivityListType[],
  activities: Activity[],
) => {
  const combined = new Set<Activity>();
  for (const listType of listTypes) {
    const build = activityListBuilders[listType];
    const list = build(activities);
    list.forEach((e) => combined.add(e));
  }
  return Array.from(combined);
};

/**
 *  Tags
 */

// Tags management
export let enabledTags: Tag[] = [];

export const toggleTagEnabled = (t: string) => {
  if (enabledTags.includes(t)) {
    const index = enabledTags.indexOf(t);
    if (~index) enabledTags.splice(index, 1);
  } else {
    enabledTags.push(t);
  }
};

export const availableTags = () => {
  //TOFIX
  console.log("de-implemented temporarily for sql integration");
  //return new Set<Tag>(getState().activities.flatMap((a) => a.tags));
  return new Set<Tag>();
};

/**
 *  UI helpers for displaying a list of Activities, and toggling builders
 */

export const formatActivitiesList = async (activities: Activity[]) => {
  // TOFIX: abstract sorting and filtering into a reuseable module; check for query lang libs
  const sorted = activities.sort(
    (l, r) => r.lastAccessed.getTime() - l.lastAccessed.getTime(),
  );
  const mapped = sorted.map((c) => {
    // TOFIX: consider & for sticky activities
    //        but then what about active *and* sticky activities?
    //        maybe sticky activities *must* be initialized to be valid?
    //        ie, can't deactivate a activity until it is also no longer sticky

    let marker = c.active ? "*" : "^";

    // if (c.tags.includes('sticky')) {
    //   marker = '%'
    // }
    const activityId = c.activityId + marker;
    const tags = c.tags.join(",");
    return `${activityId.padEnd(80, " ")}  ${tags}`;
  });
  return mapped.length > 0
    ? mapped.reduce((prev, item) => prev + "\n" + item)
    : "";
};

export const formatActivitiesListExtended = async (activities: Activity[]) => {
  // TOFIX: abstract sorting and filtering into a reuseable module; check for query lang libs
  const mapped = activities.map((c) => {
    // TOFIX: consider & for sticky activities
    //        but then what about active *and* sticky activities?
    //        maybe sticky activities *must* be initialized to be valid?
    //        ie, can't deactivate a activity until it is also no longer sticky

    let marker = c.active ? "*" : "^";

    // if (c.tags.includes('sticky')) {
    //   marker = '%'
    // }

    //

    const display = c.name ? c.name : c.activityId + marker;
    //const activityId = c.activityId + marker;

    //TOFIX
    //const tags = c.tags.join(",").substring(0, 32).padEnd(32, " ");

    const tags = ["tag1"];

    //TOFIX absoutely atrocious
    const lastAccessed = formatDistanceToNow(c.lastAccessed, {
      includeSeconds: true,
    })
      .replace("about ", "")
      .replace("days", "days")
      .replace("day", "day")
      .replace("minutes", "mins")
      .replace("minute", "min")
      .replace("less than a", "<")
      .replace("less than", "<")
      .replace("seconds", "secs");

    return `${display.padEnd(36, " ")}  ${tags}  ${lastAccessed}`;
  });

  return mapped;
};
