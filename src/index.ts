import { Command } from 'commander'
import { Log } from './utils.js'
import { App } from './app.js'
import fs from 'node:fs/promises'

// read configuration files
const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'))

Log.stdout(`[initilizing] ${pkg.name} v${pkg.version}`)

// command line parser
const program = new Command()
program
	.name(pkg.name)
	.version(pkg.version)
	.description(pkg.description)
	.option('-c, --config <path>', 'path to config file', 'config.json')
	.option('-d, --debug', 'enable debugging', false)
	.arguments('<botId>')
	.arguments('<action>')
	.allowExcessArguments(false)
	.showHelpAfterError()
	.action(run)

async function run(botId: string, action: string) {
	// read and process command line options
	const options = program.opts()
	const config = JSON.parse(await fs.readFile(options.config, 'utf8'))
	Log.setDebugOutput(options.debug)

	// debug output
	Log.debug("[debug] debugging enabled, options:")
	Log.debugObject(options)

	config.botId = botId
	config.action = action

	// start the application to initiate redis and socket connections
	let app = new App(config)
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
