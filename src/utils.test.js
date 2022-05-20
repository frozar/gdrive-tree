import { computeObjectUpdatePart } from "./utils.js";

test("Empty update part", () => {
  expect(computeObjectUpdatePart({ a: 2, b: 4 }, { a: 2 })).toStrictEqual({});
});

test("New key in update part", () => {
  expect(computeObjectUpdatePart({ a: 2, b: 4 }, { c: 42 })).toStrictEqual({
    c: 42,
  });
});

test("One key update part", () => {
  expect(computeObjectUpdatePart({ a: 2, b: 4 }, { b: 42 })).toStrictEqual({
    b: 42,
  });
});

test("Two keys update part", () => {
  expect(
    computeObjectUpdatePart({ a: 2, b: 4 }, { a: 24, b: 42 })
  ).toStrictEqual({
    a: 24,
    b: 42,
  });
});

test("Recursive update part 1", () => {
  expect(
    computeObjectUpdatePart({ a: 2, b: 4, c: 6 }, { c: { aa: 11 } })
  ).toStrictEqual({ c: { aa: 11 } });
});

test("Recursive update part 2", () => {
  expect(
    computeObjectUpdatePart(
      { a: 2, b: 4, c: { aa: 1, bb: 2 } },
      { c: { aa: 1, bb: 2 } }
    )
  ).toStrictEqual({});
});

test("Recursive update part 3", () => {
  expect(
    computeObjectUpdatePart(
      { a: 2, b: 4, c: { aa: 1, bb: 2 } },
      { c: { aa: 11, bb: 2 } }
    )
  ).toStrictEqual({ c: { aa: 11 } });
});

test("Recursive update part 4", () => {
  expect(
    computeObjectUpdatePart(
      { a: 2, b: 4, c: { d: 3 } },
      { c: { aa: 11, bb: 2 } }
    )
  ).toStrictEqual({ c: { aa: 11, bb: 2 } });
});

test("Array 1", () => {
  expect(
    computeObjectUpdatePart({ a: 2, b: 4, c: [0, 1] }, { c: [0, 1] })
  ).toStrictEqual({});
});

test("Array 2", () => {
  expect(
    computeObjectUpdatePart({ a: 2, b: 4, c: [0, 1] }, { c: [4, 5] })
  ).toStrictEqual({ c: [4, 5] });
});
