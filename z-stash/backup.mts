type MenuKey = "currentContext" | "tabs" | "bookmarks" | "cats" | "dogs";

enum MenuKeyNew {
  currentContext,
  tabs,
  bookmarks,
  cats,
  dogs,
}

// type MenuBuilderInternal = (children: Menu[]) => void
// type MenuBuilderLeaf = (menu: Menu) => void

// type Menu = {
// 	key: MenuKey;
// 	display: string;
// 	children: Menu[];

// 	builder?: MenuBuilderInternal | MenuBuilderLeaf;
// 	handler?: MenuHandler;
// }

// type MenuInternal = {
// 	key: MenuKey;
// 	display: string;
// 	children: Array<MenuInternal | MenuLeaf>;
// 	builder: MenuBuilderInternal;
// 	handler?: MenuHandler;
// }

// type MenuLeaf = {
// 	key: MenuKey;
// 	display: string;
// 	handler: MenuHandler;
// }

// const menuRun4 = async (item: MenuItem) => {
// 	$.verbose = false

// 	let items: MenuItem[] = []

// 	if (item.builder) {
// 		console.log(`${item.display} has builder, generating child items`)
// 		items = item.builder()
// 	}

//   const mapped = item.builder ? item.builder().map((c) => c.display) : []
// 	const list = mapped.length > 0 ? mapped.reduce((prev, item) => prev + '\n' + item) : ''

// 	const rofiOut = (await $`echo ${list} | rofi -monitor -1 -normal-window -disable-history -dmenu -i -format i`).stdout.trim()
// 	const selectionIndex = parseInt(rofiOut)
// 	const selected = items[selectionIndex]

// 	if (selected.handler) {
// 		console.log(`selection ${selected.display} has handler`)
// 		selected.handler(selectionIndex)
// 	} else {
// 		menuRun4(selected)
// 	}
// }

// const menuRun3 = async (items: MenuItem[]) => {
// 	$.verbose = false
// 	const mapped = items.map((c) => c.display)
// 	const list = mapped.length > 0 ? mapped.reduce((prev, item) => prev + '\n' + item) : ''

// 	const rofiOut = (await $`echo ${list} | rofi -monitor -1 -normal-window -disable-history -dmenu -i -format i`).stdout.trim()
// 	const selectionIndex = parseInt(rofiOut)
// 	const selectedItem = items[selectionIndex]
// 	const { children, handler, builder } = selectedItem

// 	if (children) {
// 		console.log(`selection ${selectedItem.display} has children`)
// 		await menuRun3(children)
// 	} else if (builder) {
// 		console.log(`selection ${selectedItem.display} has builder`)
// 		const childItems = builder()
// 		await menuRun3(childItems)
// 	}
// 	else if (handler) {
// 		console.log(`selection ${selectedItem.display} has handler`)
// 		handler(selectionIndex)
// 	}

// }

// *************************************************************************************

// const menuRun2 = async (menu: MenuInternal) => {
// 	const mapped = menu.children.map((c) => c.display)
// 	const list = mapped.length > 0 ? mapped.reduce((prev, item) => prev + '\n' + item) : ''
// 	const rofiOut = (await $`echo ${list} | rofi -monitor -1 -normal-window -disable-history -dmenu -i -format i`).stdout.trim()

// 	const selectionIndex = parseInt(rofiOut)
// 	const selectedChild = menu.children[selectionIndex]

// 	if ("children" in selectedChild) {

// 	} else if ("builder" in selectedChild) {

// 	}
// }

// const menuTabs: Menu = {
// 	key: 'tabs',
// 	display: 'tabs menu',
// 	children: [],
// 	handler: (selection) => { console.log(`selected ${selection} for tabs menu`) }
// }

// const menuCats: Menu = {
// 	key: 'cats',
// 	display: 'cats menu',
// 	children: [],
// 	handler: (selection) => { console.log(`selected ${selection} for cats menu`) }
// }

// const menuDogs: Menu = {
// 	key: 'dogs',
// 	display: 'dogs menu',
// 	children: [],
// 	handler: (selection) => { console.log(`selected ${selection} for dogs menu`) }
// }

// const menuBookmarks: Menu = {
// 	key: 'bookmarks',
// 	display: 'bookmarks menu',
// 	children: [menuCats, menuDogs],
// 	handler: (selection) => { console.log(`selected ${selection} for bookmarks menu`) }
// }

// const menuRoot: Menu = {
// 	key: 'currentContext',
// 	display: 'current context menu',
// 	children: [menuTabs, menuBookmarks],
// 	handler: () => { console.log('select item for current context menu') }
// }

// const menuRun = async (menu: Menu) => {
// 	const mapped = menu.children.map((c) => c.display)
// 	const list = mapped.length > 0 ? mapped.reduce((prev, item) => prev + '\n' + item) : ''
// 	const rofiOut = (await $`echo ${list} | rofi -monitor -1 -normal-window -disable-history -dmenu -i -format i`).stdout.trim()

// 	const selectionIndex = parseInt(rofiOut)
// 	const selectedChild = menu.children[selectionIndex]

// 	console.log(selectionIndex)
// 	console.log(selectedChild)

// 	if (selectedChild.children) {
// 		menuRun(selectedChild)
// 	}
// 	else if (selectedChild.handler) {
// 		selectedChild.handler(selectionIndex)
// 	}
// }

//const rofiHandleMenu = async (menus: MenuKey[]) => {
//const rofiHandleMenu = async (menu: Menu) => {
// const rofiMenu = async () => {
// 	$.verbose = false

// 	const menu1: Menu = {
// 		key: 'currentContext',
// 		display: 'current context menu',
// 		children: [],
// 		handler: () => { console.log('select item for current context menu') }
// 	}

// 	const tabsMenu: Menu = {
// 		key: 'tabs',
// 		display: 'tabs menu',
// 		children: [],
// 		handler: () => { console.log('select sub-command for tabs menu') }
// 	}

// 	const menus = [menu1, tabsMenu]

// 	//const list = menus.map...

// 	const list = []

// 	const rofiOut = (await $`echo ${list} | rofi -monitor -1 -normal-window -disable-history -dmenu -i -format i`).stdout.trim()
// 	const selectedIndex = parseInt(rofiOut)

// 	//await menuHandlers[menu1.key]()

// 	const handlersz = {
// 		0: () => console.log('one'),
// 		1: rofiSelectRecentContext,
// 		2: () => console.log('three')
// 	}

// 	await handlersz[selectedIndex]()
// }
