import fs from "fs";
import YAML from "yaml";
import { createSchema as S, TsjsonParser, Validated } from "ts-json-validator";

// representation of a package
const packageSchema = S({
  type: "object",
  properties: {
    name: S({ type: "string", title: "Name of the package" }),
    tags: S({
      type: "array",
      items: S({ type: "string" }),
      title: "Associated tags for this package",
    }),
    maintainer: S({ type: "string", title: "Maintainer of this package" }),
    repository: S({
      type: "string",
      title: "URL for the associated repository",
    }),
  },
  required: ["name", "repository"],
});

// representation of a list of packages
const listSchema = S({
  type: "object",
  properties: {
    title: S({ type: "string", title: "Title of the list" }),
    description: S({ type: "string", title: "Description of the list" }),
    packages: S({
      type: "array",
      items: packageSchema,
      title: "List of packages",
    }),
  },
  required: ["title"],
});

export type PackageList = Validated<typeof listSchema>;
export type PackageLists = Record<string, PackageList>;

const listSchemaParser = new TsjsonParser(listSchema);

const packageLists: PackageLists = {};
const listsDirectory = "./lists";
const listFiles = fs.readdirSync(listsDirectory);
listFiles.forEach((file: string) => {
  const listName = file.replace(/\.[^\.]*$/, "");
  const fileContent = fs.readFileSync(`${listsDirectory}/${file}`, "utf8");
  const json = JSON.stringify(YAML.parse(fileContent));
  const parsed = listSchemaParser.parse(json);
  packageLists[listName] = parsed;
});

export default packageLists;
