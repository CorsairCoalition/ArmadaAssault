# Armada Assault

[Generally Genius](https://corsaircoalition.github.io/) (GG) is a modular generals.io bot framework for development and analysis of game strategies and actions. [CorsairCoalition](https://corsaircoalition.github.io/) is a collection of components that form the GG framework.

Armada Assault is a collection of action generators that reads the game state and recommend actions. These action recommendations are reviewed by another module that makes the decision.

## Configuration

Download `config.example.json` from the [documentation repository](https://github.com/CorsairCoalition/docs) and make desired changes.

To setup other components, see the [detailed instructions](https://corsaircoalition.github.io/setup/) on the [project website](https://corsaircoalition.github.io/).

## Execution

Install and run the executable:

```sh
npm install -g @corsaircoalition/armada-assault
armada-assault config.json
```

or run directly from npm library:

```sh
npx @corsaircoalition/armada-assault config.json
```

or use docker:

```sh
docker run -it -v ./config.json:/config.json ghcr.io/corsaircoalition/armadaassault:latest
```

## Usage

```
Usage: @corsaircoalition/armada-assault [options] <configFile> [actions...]

generals.io bot actions generator

Options:
  -V, --version  output the version number
  -d, --debug    enable debugging (default: false)
  -h, --help     display help for command
```

## Example

```
npx @corsaircoalition/armada-assault config.json attack explore spread
```
