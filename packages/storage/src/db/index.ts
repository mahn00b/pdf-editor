import Dexie from 'dexie';
import { PdfDoc } from '@pdf-editor/pdf';
import type { SerializableEdit, PdfEdit } from '@pdf-editor/pdf';
import { DB_NAME, DB_VERSION } from '@config';
import type { Document, Version, OperationRecord } from '@types';
import { getSchema } from '@schema';
import { compressSync, decompressSync } from 'fflate';

export class PdfVersionDB extends Dexie {
  private latestPdfCache = new Map<string, PdfDoc>();
  documents!: Dexie.Table<Document, string>;
  versions!: Dexie.Table<Version, number>;
  operations!: Dexie.Table<OperationRecord<PdfEdit>, number>;

  constructor() {
    super(DB_NAME);
    const schema = getSchema(DB_VERSION);
    this.version(DB_VERSION).stores(schema);

    this.documents = this.table('documents');
    this.versions = this.table('versions');
    this.operations = this.table('operations');
  }

  // --------------------------
  // Save a new version (compress PDF bytes)
  // --------------------------
async saveVersion(
  documentId: string,
  pdfDoc: PdfDoc,
  isFullSnapshot: boolean,
  edits?: SerializableEdit<PdfEdit>[]
) {
  // Require edits when saving a delta version
  if (!isFullSnapshot && (!edits || edits.length === 0)) {
    throw new Error('Edits are required when saving a delta version (isFullSnapshot=false)');
  }

  const compressedData = compressSync(pdfDoc.getRawData());
  const size = pdfDoc.getRawData().byteLength;

  // Query the versions table to find the latest version number
  const latestVersion = await this.versions
    .where('documentId')
    .equals(documentId)
    .sortBy('version')
    .then(vs => vs.pop());
  const nextVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

  const version: Version = {
    documentId,
    version: nextVersionNumber,
    isFullSnapshot,
    compressedData,
    size,
    createdAt: Date.now(),
  };

  const id = await this.transaction('rw', this.versions, this.documents, this.operations, async () => {
    const addedVersionId = await this.versions.add(version);

    if (edits && edits.length) {
      const opRecords: OperationRecord<PdfEdit>[] = edits.map(edit => ({
        documentId,
        version: nextVersionNumber,
        op: edit,
        createdAt: Date.now(),
      }));
      await this.operations.bulkAdd(opRecords);
    }

    await this.documents.update(documentId, {
      currentVersion: nextVersionNumber,
      updatedAt: Date.now(),
    });

    return addedVersionId;
  });

  pdfDoc.setVersion(nextVersionNumber);
  // Update cache with the latest PdfDoc
  this.latestPdfCache.set(documentId, pdfDoc);

  return { id, version: nextVersionNumber };
}

  // --------------------------
  // Load a compressed version into PdfDoc
  // --------------------------
  private async loadVersionData(version: Version): Promise<PdfDoc> {
    const decompressed = decompressSync(version.compressedData);
    return PdfDoc.load(decompressed);
  }

  // --------------------------
  // Reconstruct a specific version
  // --------------------------
  async getVersion(documentId: string, versionNumber: number): Promise<PdfDoc | null> {
    const versions = await this.versions
      .where('documentId')
      .equals(documentId)
      .filter(v => v.version <= versionNumber)
      .sortBy('version');

    if (!versions.length) return null;

    const fullSnapshotIndex = versions
      .map((v, i) => ({ v, i }))
      .filter(({ v }) => v.isFullSnapshot)
      .map(({ i }) => i)
      .pop();

    if (fullSnapshotIndex === undefined) throw new Error('No full snapshot found!');

    const fullSnapshot = versions[fullSnapshotIndex];
    let pdfDoc = await this.loadVersionData(fullSnapshot as Version);

    const deltaVersions = versions.slice(fullSnapshotIndex + 1);
    const editsToApply: SerializableEdit<PdfEdit>[] = [];

    // Collect all delta version numbers
    const deltaVersionNumbers = deltaVersions
      .filter(v => !v.isFullSnapshot)
      .map(v => v.version);

    // Fetch all operations for these versions in a single query
    let ops: OperationRecord<PdfEdit>[] = [];
    if (deltaVersionNumbers.length > 0) {
      ops = await this.operations
        .where('documentId')
        .equals(documentId)
        .and(op => deltaVersionNumbers.includes(op.version))
        .toArray();
    }

    // Group operations by version for quick lookup
    const opsByVersion = new Map<number, OperationRecord<PdfEdit>[]>();
    for (const op of ops) {
      if (!opsByVersion.has(op.version)) {
        opsByVersion.set(op.version, []);
      }
      opsByVersion.get(op.version)!.push(op);
    }

    for (const v of deltaVersions) {
      if (!v.isFullSnapshot) {
        const versionOps = opsByVersion.get(v.version) || [];
        editsToApply.push(...versionOps.map(op => op.op));
      }
    }

    if (editsToApply.length) {
      pdfDoc = await pdfDoc.applyOperations(editsToApply);
    }

    return pdfDoc;
  }

  async getLatestVersion(documentId: string): Promise<PdfDoc | null> {
    // Return cached instance if it exists
    if (this.latestPdfCache.has(documentId)) {
      return this.latestPdfCache.get(documentId)!;
    }

    const latest = await this.versions
      .where('documentId')
      .equals(documentId)
      .sortBy('version')
      .then(vs => vs.pop());

    if (!latest) return null;

    const pdfDoc = await this.getVersion(documentId, latest.version);

    if (pdfDoc) {
      pdfDoc.setVersion(latest.version);
      this.latestPdfCache.set(documentId, pdfDoc);
    }

    return pdfDoc;
  }

  async saveOperation(documentId: string, version: number, edit: SerializableEdit<PdfEdit>) {
    const opRecord: OperationRecord<PdfEdit> = {
      documentId,
      version,
      op: edit,
      createdAt: Date.now(),
    };

    return this.operations.add(opRecord);
  }
}
