export function evalLengthFunction(value: unknown) {
  switch (typeof value) {
    case "object":
      if (value === null) {
        break;
      }
      if (Array.isArray(value)) {
        return value.length;
      }
      return Object.keys(value).length;
    case "string":
      return value.length;
  }
  throw new Error("LENGTH: 対応できない値が指定されています。");
}
