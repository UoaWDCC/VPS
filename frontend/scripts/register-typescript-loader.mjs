import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./scripts/typescript-loader.mjs", pathToFileURL("./"));
