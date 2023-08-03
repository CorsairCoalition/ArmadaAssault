#!/usr/bin/env node

import { Command } from 'commander'
import { App } from './app.js'
import { Log } from '@corsaircoalition/common'
import fs from 'node:fs/promises'
import path from 'path'
import { fileURLToPath } from 'url';

// read configuration
const packageJsonPath = new URL('../package.json', import.meta.url)
const pkg = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))

// command line parser
const program = new Command()
program
	.name(pkg.name)
	.version(pkg.version)
	.description(pkg.description)
	.option('-d, --debug', 'enable debugging', false)
	.arguments('<configFile>')
	.arguments('[actions...]')
	.showHelpAfterError()
	.action(run)

let availableActions: string[] = []

async function getAvailableActions(): Promise<string[]> {
	if (availableActions.length > 0) return availableActions

	const currentFilePath = fileURLToPath(import.meta.url)
	const currentDir = path.dirname(currentFilePath)
	const actionDir = path.join(currentDir, 'action')
	const files = await fs.readdir(actionDir);

	availableActions = files
		.filter((file) => file.endsWith('.js') && file !== 'action.js')
		.map((file) => file.replace('.js', ''));

	return availableActions
}


async function run(configFile: string, actionNames: string[]) {
	// read and process command line options
	const options = program.opts()

	let availableActions = await getAvailableActions()

	if (actionNames.length === 0) {
		console.log()
		console.log("Available actions:", availableActions.join(", "), '\n')
		program.help()
	}

	// search for actionNames in availableActions; if not found, quit
	for (const actionName of actionNames) {
		if (!availableActions.includes(actionName)) {
			console.error()
			console.error("Action not available:", actionName, '\n')
			console.error("Available actions:", availableActions.join(", "), '\n')
			program.help({ error: true})
		}
	}

	const config = JSON.parse(await fs.readFile(configFile, 'utf8'))
	config.BOT_ID_PREFIX = config.BOT_ID_PREFIX || 'cortex'
	Log.enableDebugOutput(options['debug'])

	// debug output
	Log.stdout(`[initilizing] ${pkg.name} v${pkg.version}`)
	Log.debug("[debug] debugging enabled, options:")
	Log.debug("[debug] debugging enabled")
	Log.debugObject('Command Line Options', options)

	// start the application to initiate redis and socket connections
	let app = new App(config, actionNames)

	// gracefully exit on SIGINT and SIGTERM
	process.once('SIGINT', async () => {
		Log.stderr('Interrupted. Exiting gracefully.')
		await app.quit()
	})

	process.once('SIGTERM', async () => {
		Log.stderr('Terminated. Exiting gracefully.')
		await app.quit()
	})
}

await program.parseAsync()
