# Armada Assault

A collection of action generators that reads the game state and generates recommended actions. These action recommendations are reviewed by another module that makes the decision.

## Installation

```
npm install
npm run build
```

## Configuration

Copy `config.json.example` to `config.json` and make desired changes.

## Usage

```
Usage: node . [options] <configFile> [actions...]

a modular generals.io bot that implements advanced learning techniques

Options:
  -V, --version        output the version number
  -c, --config <path>  path to config file (default: "config.json")
  -d, --debug          enable debugging (default: false)
  -h, --help           display help for command

```

## Example

```
node . config.json attack explore spread
```
