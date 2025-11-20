
import { describe, it, expect, beforeEach } from 'vitest';
import { PDFDocument } from "pdf-lib";
import { RedactionOperation } from "..";
import { RedactionEdit } from "@types";

describe("RedactionOperation", () => {
  let pdfDoc: PDFDocument;

  beforeEach(async () => {
    pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([600, 800]);
  });

  it("applies a redaction rectangle", async () => {
    const edit: RedactionEdit = {
      type: "redact",
      page: 0,
      rect: { x: 100, y: 150, width: 200, height: 80 }
    };

    const op = new RedactionOperation(edit);

    await op.applyEdit(pdfDoc);

    // Confirm PDF remains valid
    const bytes = await pdfDoc.save();
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(100);
  });

  it("serializes correctly using BaseOperation", () => {
    const edit: RedactionEdit = {
      type: "redact",
      page: 0,
      rect: { x: 10, y: 20, width: 50, height: 50 }
    };

    const op = new RedactionOperation(edit);
    const serialized = op.serialize();

    expect(serialized.type).toBe("redact");
    expect(serialized.edit).toEqual(edit);
    expect(serialized).toHaveProperty("id");
    expect(serialized).toHaveProperty("timestamp");
  });
});
