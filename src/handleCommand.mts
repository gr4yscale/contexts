import {
  switchActivity,
  swapActivity,
  sendWindowToAnotherActivity,
  showTUI,
} from "./commands/navigation.mts";

type Listener = (command: string) => void;

let listeners: Listener[] = [];

export const registerCommandListener = (listener: Listener) => {
  listeners.push(listener);
};

export const unregisterCommandListener = (listener: Listener) => {
  const idx = listeners.indexOf(listener);
  listeners.splice(idx, 1);
};

// Root component listens for handleCommand and will change route if needed

export const handleCommand = async (
  command: string | undefined,
  args?: string,
): Promise<string | undefined> => {
  if (!command) {
    console.error("Error: You must specify a command.");
    return Promise.resolve("error");
  }

  switch (command) {
    case "globalLeader": {
      await showTUI();
      break;
    }
    case "activityNavigate": {
      await showTUI();
      break;
    }
    case "activitySelect": {
      await showTUI();
      break;
    }
    case "activitySwap": {
      await swapActivity();
      break;
    }
    case "sendWindowToAnotherActivity": {
      await sendWindowToAnotherActivity();
      break;
    }
    case "activityNavigateOld": {
      await switchActivity();
      break;
    }
    default: {
      console.error("command not recognized");
    }
  }

  for (const listener of listeners) {
    listener(command);
  }
};
