import { parse, stringify } from "yaml";
import { fs } from "zx";

export type ContextId = string;

export type Context = {
  contextId: ContextId;
  name: string;
  dwmTag?: number;
  created: Date;
  lastAccessed: Date;
  active: boolean;
  scripts: string[];
  orgBookmarks: string[];
  tags: string[];
  parentContextId?: string;
  linkGroups: LinkGroup[];
};

export type Link = {
  //id: string;
  url: string;
  //title: string;
  //description: string;
  //created: Date;
  //accessed: Date;
};

export type LinkGroup = {
  id: string;
  name?: string; // datetime
  //created: Date;
  //accessed: Date;
  //sticky: boolean;
  links: Link[];
};

export type YamlDoc = {
  contexts: Context[];
  currentContextId: ContextId;
};

let contexts: Context[] = [];
let currentContext: Context;

const dwmTags = new Array<ContextId>(32); // dwm uses a bitmask to store what "tags" a window (client) is visible on

export const contextById = (id: ContextId) =>
  contexts.find((c) => c.contextId === id);

export const getState = () => {
  return {
    contexts,
    currentContext,
    dwmTags,
  };
};

export const loadState = async () => {
  try {
    const file = fs.readFileSync("./contexts.yml", "utf8");
    const parsed = parse(file) as YamlDoc;

    contexts = parsed.contexts.map((c) => {
      const {
        contextId,
        name,
        dwmTag,
        tags,
        active,
        scripts,
        orgBookmarks,
        linkGroups,
      } = c;
      const context: Context = {
        contextId,
        name,
        dwmTag,
        created: new Date(c.created),
        lastAccessed: new Date(c.lastAccessed),
        active,
        scripts,
        orgBookmarks,
        tags,
        linkGroups,
      };
      return context;
    });

    const current = contextById(parsed.currentContextId);
    if (current) {
      currentContext = current;
    } else {
      console.error("expected to find current context");
    }

    return { currentContext, contexts };
  } catch (e) {
    console.error(e);
  }
};

export const storeState = () => {
  return;
  const state: YamlDoc = {
    currentContextId: currentContext.contextId,
    contexts,
  };
  const stringified = stringify(state);
  fs.writeFileSync("./contexts.yml", stringified);
};

export const createContext = (id: ContextId) => {
  console.log(`creating context: ${id}`);
  const context = {
    contextId: id,
    name: id,
    created: new Date(),
    lastAccessed: new Date(),
    active: false,
    scripts: [],
    orgBookmarks: [],
    tags: [],
    linkGroups: [],
  };
  contexts.push(context);
  return context;
};

export const updateCurrentContext = (context: Context) => {
  currentContext = context;
};

export const contextsActive = () => contexts.filter((c) => c.active === true);
