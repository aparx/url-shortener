import { describe, expect, test } from "@jest/globals";
import { memoize } from "./memoize";

class EmptyStruct {}

describe("memoize", () => {
  describe("test with two independent memoizations", () => {
    test("ensure two different objects with two different factories", () => {
      const resultA = memoize(() => new EmptyStruct())();
      const resultB = memoize(() => new EmptyStruct())();
      expect(resultA).toEqual(resultB);
      expect(resultA).not.toBe(resultB);
    });
    test("ensure two different objects with equal factories", () => {
      // b. With two equal factories
      const factory = () => new EmptyStruct();
      const resultA = memoize(factory)();
      const resultB = memoize(factory)();
      expect(resultA).toEqual(resultB);
      expect(resultA).not.toBe(resultB);
    });

    test("ensure two equal objects with factories returning a singleton", () => {
      // b. With two equal factories
      const singleton = new EmptyStruct();
      const resultA = memoize(() => singleton)();
      const resultB = memoize(() => singleton)();
      expect(resultA).toEqual(resultB);
      expect(resultA).toBe(resultB);
    });
  });

  describe("test data and referential integrity", () => {
    test("ensure second object is referentially inequal (memoized)", () => {
      const getStruct = memoize(() => new EmptyStruct());
      expect(getStruct()).toBe(getStruct());
    });
  });
});
