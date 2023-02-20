const fs = require("fs")
const yaml = require("yaml");

function main() {
  const subgraphYaml = fs.readFileSync('subgraph.yaml', 'utf8')
  const parsed = yaml.parse(subgraphYaml);
  delete parsed.dataSources[0].mapping.callHandlers;
  const stringified = yaml.stringify(parsed);
  console.log(stringified);
  // write the parsed data back to the file
  fs.writeFileSync('subgraph.yaml', stringified);
}

main();
