const fs = require("fs");
const yaml = require("yaml");

const subgraphYaml = fs.readFileSync("subgraph.yaml", "utf8");
const parsed = yaml.parse(subgraphYaml);
delete parsed.dataSources[0].mapping.callHandlers;
const stringified = yaml.stringify(parsed);
fs.writeFileSync("subgraph.yaml", stringified);
