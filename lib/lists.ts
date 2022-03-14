import fs from "fs";
import YAML from "yaml";
import { createSchema as S, TsjsonParser, Validated } from "ts-json-validator";

// representation of a list of packages
const schema = S({
  type: "object",
  properties: {
    title: S({ type: "string", title: "Title of the list" }),
    description: S({ type: "string", title: "Description of the list" }),
    packages: S({
      type: "array",
      items: S({ type: "string", title: "Name of the package" }),
      title: "List of packages",
    }),
  },
  required: ["title", "packages"],
});

export type PackageList = Validated<typeof schema>;
export type PackageLists = Record<string, PackageList>;

const parser = new TsjsonParser(schema);

const packageLists: PackageLists = {};
const listsDirectory = "./lists";
const listFiles = fs.readdirSync(listsDirectory);
listFiles.forEach((file: string) => {
  const listName = file.replace(/\.[^\.]*$/, "");
  const fileContent = fs.readFileSync(`${listsDirectory}/${file}`, "utf8");
  const json = JSON.stringify(YAML.parse(fileContent));
  const parsed = parser.parse(json);
  packageLists[listName] = parsed;
});

export default packageLists;
