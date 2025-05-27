import { BrowserState } from "./browser.mts";

/** Unique identifier for an Node */
export type NodeId = string;
/** Unique identifier for an Org-mode entry */
export type OrgId = string;
/** Unique identifier for a Context */
export type ContextId = string;
/** Unique identifier for a Resource */
export type ResourceId = number;

/**
 * Enum for different types of Resources.
 */
export enum ResourceType {
  WEB_LINK = "web_link",
  WEB_LINK_LIST = "web_link_list",
  LLM_CONVO = "llm_convo", // For gptel/emacs conversations
  ORG_NOTE = "org_note",
  EMACS_SESSION = "emacs_session",
}

/**
 * A Resource represents an entity that can be acted upon.
 * Examples include web links, documents, contacts, etc.
 */
export interface Resource {
  id: ResourceId;
  name: string;
  url: string; // The primary URL or identifier for the resource
  type: ResourceType;
  created: Date;
  lastAccessed: Date;
}

/**
 * A Context is a collection of related Activities.
 * It allows grouping multiple Activities that belong to the same theme or project.
 */
export interface Context {
  contextId: string;
  name: string;
  created: Date;
  activityIds: string[];
}

/**
 * An Node represents a focused work session or task.
 * Activities can contain window configurations, bookmarks, links, and other resources
 * needed to work on a specific task or project.
 */

export type Node = {
  activityId: string;
  orgId?: string;
  orgText?: string;
  name: string;
  created: Date;
  lastAccessed: Date;
  active: boolean;
  parentNodeId?: string;
  temp?: boolean;
};

export type Tag = string;

/**
 * A Link represents a URL resource associated with an Node.
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
 * These are associated with an Node.
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
