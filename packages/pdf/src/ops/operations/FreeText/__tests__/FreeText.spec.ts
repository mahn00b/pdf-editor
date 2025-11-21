import { describe, it, expect, beforeEach } from 'vitest';
import { PDFDocument } from "pdf-lib";
import { FreeTextOperation } from "..";
import { FreeTextEdit } from "@types";

describe("AddFreeTextBoxOperation", () => {
  let pdfDoc: PDFDocument;

  beforeEach(async () => {
    pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([600, 800]);
  });

  it("applies a free text box to the PDF", async () => {
    const edit: FreeTextEdit = {
      type: "freeText",
      page: 0,
      text: "Hello World",
      position: { x: 100, y: 200 },
      font: { size: 18, family: "Helvetica" },
      color: { r: 255, g: 0, b: 0 }
    };

    const op = new FreeTextOperation(edit);

    await op.applyEdit(pdfDoc);

    // Serialize PDF to ensure no errors
    const bytes = await pdfDoc.save();
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(100);
  });

  it("serializes correctly using BaseOperation", () => {
    const edit: FreeTextEdit = {
      type: "freeText",
      page: 0,
      text: "Styled text",
      position: { x: 10, y: 20 },
    };

    const op = new FreeTextOperation(edit);
    const serialized = op.serialize();

    expect(serialized).toHaveProperty("id");
    expect(serialized.type).toBe("freeText");
    expect(serialized.edit).toEqual(edit);
  });
});
