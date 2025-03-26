import { createContext } from "react";
import { KeymapInstance } from "./Keymapping.mts";

export const KeysContext = createContext<{ keymap: KeymapInstance }>({ keymap: null as unknown as KeymapInstance });
