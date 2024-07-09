import { ActivityListType, toggleActivityListTypeEnabled, getState } from "./state.mts";

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
