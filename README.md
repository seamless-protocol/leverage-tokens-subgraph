# LeverageTokens Subgraph

## Development

The subgraph manifest is generated from the `subgraph.template.yaml` [templates](./templates) using [mustache](https://www.npmjs.com/package/mustache). To generate the manifest, update the configuration in [networks.json](./networks.json) for the desired chain and then execute `npm run generate-manifest-<chain>`, e.g.:

```bash
npm run generate-manifest-ethereum
```

Additionally, some addresses from [networks.json](./networks.json) are needed in the event handler logic. To generate the necessary address constants file, execute:

```bash
npm run generate-addresses
```

For testing, [Tenderly Virtual Testnets](https://docs.tenderly.co/virtual-testnets/develop/thegraph) are recommended.

