import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PdfVersionDB } from '..';
import { PdfDoc } from '@pdf-editor/pdf';
import { PDFDocument } from 'pdf-lib';
import type { SerializableEdit, InsertTextEdit } from '@pdf-editor/pdf';

describe('PdfVersionDB', () => {
  let db: PdfVersionDB;
  let documentId: string;
  let validPdfBytes: Uint8Array;

  beforeEach(async () => {
    db = new PdfVersionDB();
    await db.delete();
    await db.open();

    documentId = 'doc1';

    // Create a valid minimal PDF
    const doc = await PDFDocument.create();
    doc.addPage([600, 400]);
    validPdfBytes = await doc.save();

    // Add a document entry
    await db.documents.add({
      key: documentId,
      name: 'Test PDF',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      currentVersion: 0,
    });
  });

  afterEach(async () => {
    await db.delete();
  });

  it('saves a full snapshot version', async () => {
    const pdfDoc = await PdfDoc.load(validPdfBytes);

    const { id, version } = await db.saveVersion(documentId, pdfDoc, true);

    expect(id).toBeDefined();
    expect(version).toBe(1);

    const storedVersion = await db.versions.get(id);
    expect(storedVersion?.isFullSnapshot).toBe(true);
  });

  it('saves operations and retrieves them', async () => {
    const edit: SerializableEdit<InsertTextEdit> = {
      id: 'op1',
      type: 'insert-text',
      page: 0,
      timestamp: Date.now(),
      edit: {
        type: 'insert-text',
        page: 0,
        value: 'Hello',
        position: { x: 10, y: 10 },
      },
    };

    await db.saveOperation(documentId, 1, edit);

    const ops = await db.operations.where('documentId').equals(documentId).toArray();
    expect(ops.length).toBe(1);

    const op = ops[0]?.op;
    if (op && op.edit.type === 'insert-text') {
      expect(op.edit.value).toBeDefined();
    } else {
      throw new Error('Expected insert-text operation');
    }
  });

  it('reconstructs a version with full snapshot only', async () => {
    const pdfDoc = await PdfDoc.load(validPdfBytes);
    await db.saveVersion(documentId, pdfDoc, true);

    const reconstructed = await db.getVersion(documentId, 1);
    expect(reconstructed).toBeInstanceOf(PdfDoc);
    expect(reconstructed?.getRawData()).toEqual(validPdfBytes);
  });

  it('applies deltas to reconstruct a version', async () => {
    let pdfDoc = await PdfDoc.load(validPdfBytes);

    // Save full snapshot
    await db.saveVersion(documentId, pdfDoc, true);

    // Create a delta edit
    const insertEdit: SerializableEdit<InsertTextEdit> = {
      id: 'op1',
      type: 'insert-text',
      page: 0,
      timestamp: Date.now(),
      edit: {
        type: 'insert-text',
        page: 0,
        value: 'Delta',
        position: { x: 10, y: 10 },
      },
    };

    // Save delta operation as version 2
    await db.saveVersion(documentId, pdfDoc, false);
    await db.saveOperation(documentId, 2, insertEdit);

    const reconstructed = await db.getVersion(documentId, 2);
    expect(reconstructed).toBeInstanceOf(PdfDoc);
  });

  it('retrieves the latest version', async () => {
    const pdfDoc = await PdfDoc.load(validPdfBytes);

    await db.saveVersion(documentId, pdfDoc, true);

    const latest = await db.getLatestVersion(documentId);
    expect(latest).toBeInstanceOf(PdfDoc);
  });
});
