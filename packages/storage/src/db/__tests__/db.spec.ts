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

    // Type assertion fix: Narrow the type or cast it
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

    // Save delta version with edits
    await db.saveVersion(documentId, pdfDoc, false, [insertEdit]);

    const reconstructed = await db.getVersion(documentId, 2);
    expect(reconstructed).toBeInstanceOf(PdfDoc);
  });

  it('retrieves the latest version', async () => {
    const pdfDoc = await PdfDoc.load(validPdfBytes);

    await db.saveVersion(documentId, pdfDoc, true);

    const latest = await db.getLatestVersion(documentId);
    expect(latest).toBeInstanceOf(PdfDoc);
  });

  it('throws an error when saving delta version without edits', async () => {
    const pdfDoc = await PdfDoc.load(validPdfBytes);

    // Save full snapshot first
    await db.saveVersion(documentId, pdfDoc, true);

    // Attempt to save delta version without edits should throw
    await expect(db.saveVersion(documentId, pdfDoc, false)).rejects.toThrow(
      'Edits are required when saving a delta version (isFullSnapshot=false)'
    );

    // Attempt to save delta version with empty edits array should also throw
    await expect(db.saveVersion(documentId, pdfDoc, false, [])).rejects.toThrow(
      'Edits are required when saving a delta version (isFullSnapshot=false)'
    );
  });

  it('saves edits when provided to saveVersion and stores them in operations table', async () => {
    const pdfDoc = await PdfDoc.load(validPdfBytes);

    // Save full snapshot first
    await db.saveVersion(documentId, pdfDoc, true);

    // Create multiple edits for the delta version
    const edit1: SerializableEdit<InsertTextEdit> = {
      id: 'op1',
      type: 'insert-text',
      page: 0,
      timestamp: Date.now(),
      edit: {
        type: 'insert-text',
        page: 0,
        value: 'First edit',
        position: { x: 10, y: 10 },
      },
    };

    const edit2: SerializableEdit<InsertTextEdit> = {
      id: 'op2',
      type: 'insert-text',
      page: 0,
      timestamp: Date.now() + 1,
      edit: {
        type: 'insert-text',
        page: 0,
        value: 'Second edit',
        position: { x: 20, y: 20 },
      },
    };

    // Save delta version with edits
    const { version } = await db.saveVersion(documentId, pdfDoc, false, [edit1, edit2]);

    // Verify the edits were stored in the operations table
    const ops = await db.operations
      .where('documentId')
      .equals(documentId)
      .and(op => op.version === version)
      .toArray();

    expect(ops.length).toBe(2);

    // Verify first edit
    const op1 = ops.find(op => op.op.id === 'op1');
    expect(op1).toBeDefined();
    expect(op1?.op.type).toBe('insert-text');
    if (op1 && op1.op.edit.type === 'insert-text') {
      expect(op1.op.edit.value).toBe('First edit');
      expect(op1.op.edit.position).toEqual({ x: 10, y: 10 });
    }

    // Verify second edit
    const op2 = ops.find(op => op.op.id === 'op2');
    expect(op2).toBeDefined();
    expect(op2?.op.type).toBe('insert-text');
    if (op2 && op2.op.edit.type === 'insert-text') {
      expect(op2.op.edit.value).toBe('Second edit');
      expect(op2.op.edit.position).toEqual({ x: 20, y: 20 });
    }
  });

  it('allows saving full snapshot without edits', async () => {
    const pdfDoc = await PdfDoc.load(validPdfBytes);

    // Should allow full snapshot without edits
    const { id, version } = await db.saveVersion(documentId, pdfDoc, true);

    expect(id).toBeDefined();
    expect(version).toBe(1);

    // Verify no operations were stored
    const ops = await db.operations
      .where('documentId')
      .equals(documentId)
      .and(op => op.version === version)
      .toArray();

    expect(ops.length).toBe(0);
  });

  it('allows saving full snapshot with edits (optional)', async () => {
    const pdfDoc = await PdfDoc.load(validPdfBytes);

    const edit: SerializableEdit<InsertTextEdit> = {
      id: 'op1',
      type: 'insert-text',
      page: 0,
      timestamp: Date.now(),
      edit: {
        type: 'insert-text',
        page: 0,
        value: 'Edit with snapshot',
        position: { x: 10, y: 10 },
      },
    };

    // Should allow full snapshot with edits (optional)
    const { id, version } = await db.saveVersion(documentId, pdfDoc, true, [edit]);

    expect(id).toBeDefined();
    expect(version).toBe(1);

    // Verify the edit was stored
    const ops = await db.operations
      .where('documentId')
      .equals(documentId)
      .and(op => op.version === version)
      .toArray();

    expect(ops.length).toBe(1);
    expect(ops[0]?.op.id).toBe('op1');
  });
});
