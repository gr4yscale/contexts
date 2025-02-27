import { BrowserState } from "./browser.mts";

/** Unique identifier for an Activity */
export type ActivityId = string;
/** Unique identifier for an Org-mode entry */
export type OrgId = string;

/**
 * An Activity represents a focused work session or task.
 * Activities can contain window configurations, bookmarks, links, and other resources
 * needed to work on a specific task or project.
 */

export type Activity = {
  activityId: string;
  orgId?: string;
  orgText?: string;
  name: string;
  dwmTag?: number;
  created: Date;
  lastAccessed: Date;
  active: boolean;
  parentActivityId?: string;
};

// export type Activity = {
//   activityId: ActivityId;
//   orgId: OrgId;
//   orgText: string;
//   name: string;
//   dwmTag?: number;
//   created: Date;
//   lastAccessed: Date;
//   active: boolean;
//   scripts: string[];
//   emacsWindowBookmarks: EmacsBookmark[];
//   emacsOrgBookmarks: EmacsBookmark[];
//   tags: string[];
//   linkGroups: LinkGroup[];
//   links: Link[];
//   actions: string[];
//   browserStates: BrowserState[];
// };

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
 * TODO: create EmacsSession type
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
  activities: Activity[];
  currentActivityId: ActivityId;
  previousActivityId: ActivityId;
};

export type State = {
  activities: Activity[];
  dwmTags: Array<ActivityId>;
};
