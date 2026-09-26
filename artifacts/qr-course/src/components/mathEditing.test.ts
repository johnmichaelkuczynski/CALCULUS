import { describe, it } from "node:test";
import { deepStrictEqual, strictEqual } from "node:assert";
import { backspaceMath, insertMath, nextMathSlot } from "./mathEditing";

describe("math keyboard caret and slots", () => {
  it("inserts at a blurred textarea's retained selection and selects the first slot", () => {
    deepStrictEqual(insertMath("abcd", { start: 1, end: 3 }, "\\frac{□}{□}"), {
      value: "a\\frac{bc}{□}d",
      selection: { start: 11, end: 12 },
    });
  });

  it("replaces a selected slot and advances to the next one", () => {
    const edit = insertMath("\\frac{□}{□}", { start: 6, end: 7 }, "x");
    strictEqual(edit.value, "\\frac{x}{□}");
    deepStrictEqual(nextMathSlot(edit.value, edit.selection), { start: 9, end: 10 });
    deepStrictEqual(nextMathSlot("□ + □", { start: 4, end: 5 }), { start: 0, end: 1 });
    deepStrictEqual(insertMath("ab", { start: 1, end: 1 }, "π"), {
      value: "aπb", selection: { start: 2, end: 2 },
    });
  });

  it("backspaces at the caret, including whole unicode symbols", () => {
    deepStrictEqual(backspaceMath("a😀b", { start: 3, end: 3 }), {
      value: "ab", selection: { start: 1, end: 1 },
    });
    deepStrictEqual(backspaceMath("abc", { start: 1, end: 3 }), {
      value: "a", selection: { start: 1, end: 1 },
    });
  });
});