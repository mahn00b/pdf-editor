import { schema as v1 } from "./versions/v1.lock";

const SCHEMA: Record<number, Record<string, string>> = {
  [1]: v1,
}

export function getSchema(version: number) {
  const schema = SCHEMA[version];
  if (!schema) {
    throw new Error(`Unsupported schema version: ${version}`);
  }
  return schema;
}