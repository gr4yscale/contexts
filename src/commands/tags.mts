import { availableTags, toggleTagEnabled, getState } from "../state.mts";

export const menuTagsToggle = () => {
  const tags = Array.from(availableTags())
  const { enabledTags } = getState();
  return tags.map((t) => {
    let marker = enabledTags.includes(t) ? "*" : "";
    const withMarker = t + marker;
    const display = `${withMarker.padEnd(80, " ")}`;

    return {
      display,
      handler: async (_?: number) => {
        toggleTagEnabled(t)
      },
    };
  });
};

export const listEnabledTags = async () => {
  const { enabledTags } = getState();
  return enabledTags.join(',')
}
