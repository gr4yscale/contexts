const globalKeymap = {
  f: () => {
    /* run command */
  },
  g: () => {
    return {
      t: () => {
        /* run command */
      },
    };
  },
};

const modeKeymapSelection = {
  "1": () => console.log("1"),
};

type Modes = "selection";
type KeyMaps = typeof globalKeymap | typeof modeKeymapSelection;

let activeKeymaps: KeyMaps[] = [globalKeymap];

const activateMode = (mode: Modes) => {
  const keyMapForMode = {
    selection: modeKeymapSelection,
  };
  activeKeymaps = [globalKeymap, keyMapForMode[mode]];
};

console.log(activeKeymaps);

activateMode("selection");
