# LeverageTokens Subgraph

## Development

The subgraph manifest is generated from the [subgraph.template.yaml](./subgraph.template.yaml) template using [mustache](https://www.npmjs.com/package/mustache). To generate the manifest, update the configuration in [networks.json](./networks.json) and then execute:

```bash
npm run generate-manifest
```

Additionally, some addresses from [networks.json](./networks.json) are needed in the event handler logic. To generate the necessary address constants file, execute:

```bash
npm run generate-addresses
```

For testing, [Tenderly Virtual Testnets](https://docs.tenderly.co/virtual-testnets/develop/thegraph) are recommended.

