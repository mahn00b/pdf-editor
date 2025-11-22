export const schema = {
  documents: `
    key,
    name,
    createdAt,
    updatedAt,
    currentVersion
  `,
  versions: `
    ++id,
    documentId,
    version,
    [documentId+version],
    createdAt
  `,
  operations: `
    ++id,
    documentId,
    version,
    [documentId+version],
    createdAt
  `
};