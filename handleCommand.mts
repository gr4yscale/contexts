import { getState, storeState } from "./state.mts";
export const handleCommand = async (command: string | undefined, args?: string) => {
    if (!command) {
        console.error("Error: You must specify a command.");
        return;
    }
    console.log(`handling command ${command}`);

    const currentContext = getState().currentContext;

    switch (command) {
        case "deactivateWorkspace": {
            //TOFIX: confirmation
            await deallocateWorkspace(currentContext);
            storeState();
            break;
        }
        default: {
            console.error("command not recognized");
        }
    }
};
