import { StringBoolean } from "../data-types";

export function toStringBoolean(x: boolean): StringBoolean {
    return x ? "true" : "false"
}

export function toStringBooleanOptional(x: boolean | undefined): StringBoolean | undefined {
    return x === undefined ? undefined : toStringBoolean(x);
}
