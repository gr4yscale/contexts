import { BrowserState } from "./browser.mts";
import { ActivityListType } from "./activityList.mts";

/** Unique identifier for an Activity */
export type ActivityId = string;
/** Unique identifier for a Context */
export type ContextId = string;
/** Unique identifier for an Org-mode entry */
export type OrgId = string;

/**
 * A Context represents a high-level grouping of related Activities and Org-mode entries.
 * It helps organize work into logical collections that can be switched between.
 */
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

/**
 * An Activity represents a focused work session or task.
 * Activities can contain window configurations, bookmarks, links, and other resources
 * needed to work on a specific task or project.
 */
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
  parentActivityId?: string;
  linkGroups: LinkGroup[];
  links: Link[];
  actions: string[];
  browserStates: BrowserState[];
};

export type Tag = string;

/**
 * A Link represents a URL resource associated with an Activity.
 * Links can be organized into LinkGroups and marked as sticky for persistence.
 */
export type Link = {
  id: string;
  url: string;
  title: string;
  description?: string;
  created: Date;
  accessed: Date;
  sticky: boolean;
};

/**
 * A LinkGroup is, in practice, a list of tabs open in a browser window.
 * These are associated with an Activity.
 */
export type LinkGroup = {
  id: string;
  name: string; // default to created time, plus details of parent activity?
  description?: string;
  created: Date;
  accessed: Date;
  links: Link[];
};

/**
 * An EmacsBookmark represents a saved location in an org document in Emacs+orgmode
 * Originally this was a URL that Burley.el could load to restore a window configuration and open buffers
 * Now, I use easysession.el and load/store named sessions
 */
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
  currentActivityId: ActivityId;
  previousActivityId: ActivityId;
};

export type State = {
  currentContext: Context;
  contexts: Context[];
  activities: Activity[];
  currentActivity: Activity;
  previousActivity: Activity;
  dwmTags: Array<ActivityId>;
};
