import { createContext } from "react";

import { getState } from "../../state.mts";

const StateContext = createContext({ state: getState() });

export const Provider = StateContext.Provider;
export const Consumer = StateContext.Consumer;
