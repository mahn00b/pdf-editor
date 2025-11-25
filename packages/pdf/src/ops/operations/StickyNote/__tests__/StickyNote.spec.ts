import { describe, it, expect } from 'vitest';
import { PDFArray, PDFDocument, PDFName, PDFObject } from 'pdf-lib';
import { StickyNoteOperation } from '..';
import type { AddStickyNoteEdit, SerializableEdit } from '@types';

function makeSerializable(edit: AddStickyNoteEdit): Omit<SerializableEdit<AddStickyNoteEdit>, 'id' | 'timestamp'> {
  return {
    type: edit.type,
    page: edit.page,
    edit,
  };
}

describe('StickyNoteOperation', () => {
  it('constructs properly', () => {
    const serial = {
      type: 'add-sticky-note' as const,
      page: 0,
      text: 'Hello',
      position: { x: 50, y: 50 },
    };

    const op = new StickyNoteOperation(serial);
    const {id, timestamp, ...serialized} = op.serialize();
    expect(serialized).toEqual(makeSerializable(serial));
  });

  it('applies a sticky note annotation to the correct page', async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage();

    const serial = {
      type: 'add-sticky-note' as const,
      page: 0,
      text: 'Test Note',
      position: { x: 100, y: 200 },
      icon: 'Comment' as const,
      author: 'Tester',
      open: true,
    };

    const op = new StickyNoteOperation(serial);
    await op.applyEdit(pdf);

    const page = pdf.getPage(0);
    const annots = page.node.get(PDFName.of('Annots')) as PDFArray;

    expect(annots).toBeDefined();
    expect(annots.size()).toBe(1);
    const annotRef = annots.get(0) as PDFObject;
    const annotDict = pdf.context.lookup(annotRef) as any;
    const subtype = (annotDict.get(PDFName.of('Subtype')) as PDFName).asString();
    const contents = (annotDict.get(PDFName.of('Contents')) as any).asString();

    expect(subtype).toBe('/Text');
    expect(contents).toBe('Test Note');
  });

  it('includes all optional fields when present', async () => {
    const serial = {
      type: 'add-sticky-note' as const,
      page: 0,
      text: 'With icon and author',
      position: { x: 10, y: 10 },
      icon: 'Help' as const,
      author: 'Alice',
      open: true,
    };

    const op = new StickyNoteOperation(serial);
    const serialized = op.serialize();
    expect(serialized.edit.icon).toBe('Help');
    expect(serialized.edit.author).toBe('Alice');
    expect(serialized.edit.open).toBe(true);
  });

  it('omits optional fields when they are not provided', async () => {
    const serial = {
      type: 'add-sticky-note' as const,
      page: 0,
      text: 'No optional fields',
      position: { x: 10, y: 10 },
    };

    const op = new StickyNoteOperation(serial);
    const serialized = op.serialize().edit;

    expect(serialized.icon).toBeUndefined();
    expect(serialized.author).toBeUndefined();
    expect(serialized.open).toBeUndefined();
  });
});
