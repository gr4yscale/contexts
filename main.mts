
import { $, fs, argv, sleep } from "zx";
import { parse, stringify } from "yaml"
import { spawn } from "child_process"
import clipboard from 'clipboardy';


type ContextId = string;

type Context = {
	contextId: ContextId;
	name: string;
	dwmTag?: number;
	created: Date;
	lastAccessed: Date;
	active: boolean;
	scripts: string[];
	orgBookmarks: string[];
	tags: string[];
	parentContextId?: string;
	linkGroups: LinkGroup[];
}

type Link = {
	//id: string;
	url: string;
	//title: string;
	//description: string;
	//created: Date;
	//accessed: Date;
}

type LinkGroup = {
	id: string;
	name?: string; // datetime
	//created: Date;
	//accessed: Date;
	//sticky: boolean;
	links: Link[];
}

type YamlDoc = {
	contexts: Context[];
	currentContextId: ContextId;
}


// state
const dwmTags = new Array<ContextId>(32) // dwm uses a bitmask to store what "tags" a window (client) is visible on
let contexts: Context[] = []
let currentContext: Context

const loadState = async () => {
	const file = fs.readFileSync('./contexts.yml', 'utf8')
	const parsed = parse(file) as YamlDoc

	contexts = parsed.contexts.map((c) => {
		const { contextId, name, dwmTag, tags, active, scripts, orgBookmarks, linkGroups } = c
		const context: Context = {
			contextId,
			name,
			dwmTag,
			created: new Date(c.created),
			lastAccessed: new Date(c.lastAccessed),
			active,
			scripts,
			orgBookmarks,
			tags,
			linkGroups
		}
		return context
	})

	const current = contextById(parsed.currentContextId)
	if (current) { currentContext = current }
}

const storeState = () => {
	const state: YamlDoc = {
		currentContextId: currentContext.contextId,
		contexts
	}
	const stringified = stringify(state)
	fs.writeFileSync('./contexts.yml', stringified)
}


// dwm
const findEmptyDwmTag = () => {
	for (let i = 1; i < dwmTags.length; i++) {
		console.log(`tag: ${i}, val: ${dwmTags[i]}`)
		if (!dwmTags[i]) {
			$`notify-send "Found empty dwm tag: ${i}"`
			return i
		}
	}
	return 0
}

const assignEmptyDwmTag = async (context: Context) => {
	const tag = findEmptyDwmTag()
	context.dwmTag = tag
	dwmTags[tag] = context.contextId
}

const syncDwmTags = (contexts: Context[]) => {
	for (const c of contexts) {
		//console.log(`checking context ${c.contextId} to see if dwm tag is assigned`)
		if (c.dwmTag !== undefined && c.dwmTag < dwmTags.length) {
			dwmTags[c.dwmTag] = c.contextId
		} else {
			console.log(`context did not have a dwm tag assigned: ${c.contextId}`)
		}
	}
}

const viewDwmTag = async (context: Context) => {
	if (context.dwmTag === undefined) {
		console.log("Error: context is without a DWM tag!");
		return
	}
	await $`dwmc viewex ${context.dwmTag}`
}
const sendWindowToAnotherContext = async () => {
	const context = await selectRecentContext("send to context:")
	if (context) {
		console.log(`sending window to ${context.dwmTag}: ${context.contextId}`)
		await $`dwmc tagex ${context.dwmTag}`
	}
}


// lifecycle
const createContext = (id: ContextId) => {
	console.log(`creating context: ${id}`)
	const context = {
		contextId: id,
		name: id,
		created: new Date(),
		lastAccessed: new Date(),
		active: false,
		scripts: [],
		orgBookmarks: [],
		tags: [],
		linkGroups: []
	}
	contexts.push(context)
	return context
}

const initContext = async (context: Context) => {
	// run scripts
}

const activateContext = async (context: Context) => {
	if (context.dwmTag === undefined) {
		assignEmptyDwmTag(context)
	}

	await viewDwmTag(context)
	context.active = true
}

const deactivateContext = async (context: Context) => {
	await viewDwmTag(context)
	context.active = false
}

// rofi
const rofiSelect = async (list: string, prompt: string) => {
	$.verbose = false
	const selection = await $`echo ${list} | rofi -monitor -1 -normal-window -disable-history -dmenu -i -p ${prompt}`
	const sanitized = selection.stdout.trim().replace('*', '').split(' ')
	if (sanitized[0]) {
		return sanitized[0]
	}
}
// utils
const contextById = (id: ContextId) => contexts.find((c) => c.contextId === id)
const contextsActive = () => contexts.filter((c) => c.active === true)


// commands
const listRecentContexts = async () => {
	const sorted = contexts.sort((l, r) => r.lastAccessed.getTime() - l.lastAccessed.getTime())
	const mapped = sorted.map((c) => {
		const activeMarker = c.active ? '*' : ''
		const contextId = c.contextId + activeMarker
		return contextId.padEnd(64, ' ') + c.tags.join(',')
	})
	return mapped.length > 0 ? mapped.reduce((prev, item) => prev + '\n' + item) : ''
}

const selectRecentContextId = async (prompt: string) => {
	const recentList = await listRecentContexts()
	return await rofiSelect(recentList, prompt ?? 'context: ')
}

const selectRecentContext = async (prompt: string) => {
	const contextId = await selectRecentContextId(prompt)
	if (contextId) {
		return contextById(contextId)
	}
}

const switchContextRofi = async () => {
	const selectedContextId = await selectRecentContextId('select context:')
	if (selectedContextId) {
		await switchContext(selectedContextId)
	}
}

const switchContext = async (id: ContextId) => {
	let context: Context | undefined;
	context = contextById(id)
	if (!context) {
		console.log(`context not found, creating for id: ${id}`)
		context = createContext(id)
		$`notify-send "Created new context: ${id}"`
	}

	currentContext = context

	context.lastAccessed = new Date()

	await activateContext(context)
}

// commands



const command = async () => {
	if (!argv.command) {
		console.log("Error: You must specify the --command arg");
		return
	}

	switch (argv.command) {
		case 'switchContextRofi': {
			await switchContextRofi()
			storeState()
			break
		}
		case 'switchContext': {
			await switchContext(argv.contextId)
			storeState()
			break
		}
		case 'sendWindowToAnotherContext': {
			await sendWindowToAnotherContext()
			break
		}
		case 'currentContextInit': {
			await initContext(currentContext)
			break
		}
	}
}

try {
	loadState()
	syncDwmTags(contextsActive())
	await command()
} catch (e) {
	console.error(e)
}
