import { getState } from "../state.mts";

export const listEnabledModes = async () => {
  const { enabledModes } = getState();
  return enabledModes.join(',')
}
