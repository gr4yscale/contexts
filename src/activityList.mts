import { Activity, toggleActivityListTypeEnabled, getState } from "./state.mts";
import { formatDistanceToNow } from "date-fns";


export enum ActivityListType {
  All = "all",
  Active = "active",
  EnabledTags = "enabledTags",
  OrgIds = "orgIds",
  CurrentContext = "currentContext"
  // selected,
  // transient,
  // recent?
}

type ActivityListBuilder = (activities: Activity[]) => Activity[]



export const menuActivityListTypesToggle = () => {
  const activityListTypes = Object.values(ActivityListType)

  const { enabledActivityListTypes } = getState();
  return activityListTypes.map((l) => {
    let marker = enabledActivityListTypes.includes(l) ? "*" : "";
    const withMarker = l + marker;
    const display = `${withMarker.padEnd(80, " ")}`;

    return {
      display,
      handler: async (_?: number) => {
        toggleActivityListTypeEnabled(l)
      },
    };
  });
};



// activities lists

export const activitiesAll = (a: Activity[]) => a

export const activitiesActive = (a: Activity[]) => a.filter((c) => c.active === true);

export const activitiesEnabledTags = (activities: Activity[]) => {
  const filtered = new Set<Activity>()
  getState().enabledTags.forEach((t) => {
    const matches = activities.filter((a) => a.tags.includes(t))
    matches.forEach((m) => filtered.add(m))
  })
  return Array.from(filtered)
}

export const activitiesOrgIds = (activities: Activity[]) => {
  return activities.filter((a) => a.tags.includes('orgTask'))
}

export const activitiesCurrentContext = (activities: Activity[]) => {
  return activities.filter((a) => getState().context.activityIds.includes(a.activityId))
}

const activityListBuilders: Record<ActivityListType, ActivityListBuilder> = {
  [ActivityListType.All]: activitiesAll,
  [ActivityListType.Active]: activitiesActive,
  [ActivityListType.EnabledTags]: activitiesEnabledTags,
  [ActivityListType.OrgIds]: activitiesOrgIds,
  [ActivityListType.CurrentContext]: activitiesCurrentContext,
};

export const buildActivityList = (listTypes: ActivityListType[], activities: Activity[]) => {
  const combined = new Set<Activity>()
  for (const listType of listTypes) {
    const build = activityListBuilders[listType];
    const list = build(activities)
    list.forEach((e) => combined.add(e))
  }
  return Array.from(combined)
}


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
    const tags = c.tags.join(",").substring(0, 32).padEnd(32, ' ')
    //TOFIX absoutely atrocious
    const lastAccessed = formatDistanceToNow(c.lastAccessed, { includeSeconds: true }).replace('about ', '').replace('days', 'days').replace('day', 'day').replace('minutes', 'mins').replace('minute', 'min').replace('less than a', '<').replace('less than', '<').replace('seconds', 'secs')

    return `${display.padEnd(36, " ")}  ${tags}  ${lastAccessed}`;
  });

  return mapped
};
