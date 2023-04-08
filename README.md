# Armada Assault

A collection of action generators that reads the game state and generates recommended actions. These action recommendations are reviewed by another module that makes the decision.

## Installation

```
npm install
npm run build
```

## Configuration

Copy `config.json.example` to `config.json` and enter your Redis configuration.

## Usage

```
Usage: npm start [options] <botId> <action>

a modular generals.io bot that implements advanced learning techniques

Options:
  -V, --version        output the version number
  -c, --config <path>  path to config file (default: "config.json")
  -d, --debug          enable debugging (default: false)
  -h, --help           display help for command

```
