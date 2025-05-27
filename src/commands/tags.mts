import {
  enabledTags,
  availableTags,
  toggleTagEnabled,
} from "../nodeList.mts";

export const menuTagsToggle = () => {
  const tags = Array.from(availableTags());
  return tags.map((t) => {
    let marker = enabledTags.includes(t) ? "*" : "";
    const withMarker = t + marker;
    const display = `${withMarker.padEnd(80, " ")}`;

    return {
      display,
      handler: async (_?: number) => {
        toggleTagEnabled(t);
      },
    };
  });
};

export const listEnabledTags = async () => {
  return enabledTags.join(",");
};
