import { $ } from "zx";

type MenuHandler = (selectionIndex?: number) => void;

export type MenuItem = {
  //key
  //index: number;
  display: string;
  children?: MenuItem[];
  selectionIndex?: number;
  builder?: () => MenuItem[];
  handler?: MenuHandler;
};

const rofiSelectItem = async (items: MenuItem[], prompt: string) => {
  $.verbose = false;

  const mapped = items.map((c) => c.display);
  const list =
    mapped.length > 0 ? mapped.reduce((prev, item) => prev + "\n" + item) : "";

  const rofi =
    await $`echo ${list} | rofi -monitor primary -normal-window -disable-history -dmenu -i -format i -p ${prompt}`.nothrow();

  //console.log('*** rofi stdout ***')
  //console.log(rofi.stdout.trim())

  if (rofi.stdout.trim() === "") {
    return;
  }

  const selectionIndex = parseInt(rofi.stdout.trim());
  //console.log(`selectionIndex:  ${selectionIndex}`)
  //console.log(selectionIndex)
  //console.log(`selectionIndex:  ${selectionIndex}`)
  const item = items[selectionIndex];
  item.selectionIndex = selectionIndex;
  return item;
};

export const buildMenu = async (item: MenuItem) => {
  if (item.builder) {
    //console.log(`${item.display} has builder, generating child items`);
    const items = item.builder();
    const selected = await rofiSelectItem(items, item.display);
    selected && (await buildMenu(selected));
  } else if (item.handler) {
    // console.log(
    //   `item ${item.display} with selectionIndex ${item.selectionIndex} has a handler; calling`,
    // );
    if (item.selectionIndex !== undefined) {
      item.handler(item.selectionIndex);
    } else {
      item.handler();
    }
  }
};
