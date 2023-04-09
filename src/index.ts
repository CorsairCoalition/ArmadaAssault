import { Command } from 'commander'
import { Log, getAvailableActions } from './utils.js'
import { App } from './app.js'
import fs from 'node:fs/promises'

// read configuration files
const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'))

// command line parser
const program = new Command()
program
	.name(pkg.name)
	.version(pkg.version)
	.description(pkg.description)
	.option('-c, --config <path>', 'path to config file', 'config.json')
	.option('-d, --debug', 'enable debugging', false)
	.arguments('<botId>')
	.arguments('[actions...]')
	.showHelpAfterError()
	.action(run)

async function run(botId: string, actionNames: string[]) {
	// read and process command line options
	const options = program.opts()

	let availableActions = getAvailableActions()

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

	const config = JSON.parse(await fs.readFile(options.config, 'utf8'))
	Log.setDebugOutput(options.debug)

	// debug output
	Log.stdout(`[initilizing] ${pkg.name} v${pkg.version}`)
	Log.debug("[debug] debugging enabled, options:")
	Log.debug("[debug] debugging enabled")
	Log.debugObject('Command Line Options', options)

	config.botId = botId

	// start the application to initiate redis and socket connections
	let app = new App(config, actionNames)
	// gracefully exit on SIGINT and SIGTERM
	process.once('SIGINT', async (code) => {
		Log.stderr('Interrupted. Exiting gracefully.')
		app.quit()
	})

	process.once('SIGTERM', async (code) => {
		Log.stderr('Terminated. Exiting gracefully.')
		app.quit()
	})
}

await program.parseAsync()
