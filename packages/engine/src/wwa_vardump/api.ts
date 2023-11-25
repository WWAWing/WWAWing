import * as NamedUserVariable from "./named-user-variable/api";
import * as NumberedUserVariable from "./numbered-user-variable/api";

export { NamedUserVariable, NumberedUserVariable };

export function updateAllVariables({
    dumpElement,
    namedUserVar,
    userVar
}: {dumpElement: HTMLElement, namedUserVar?: Map<string, string | number | boolean>, userVar?: (string | number | boolean)[]}) {
    if (namedUserVar) {
        NamedUserVariable.updateValues(dumpElement, namedUserVar);
    }
    if (userVar) {
        NumberedUserVariable.updateValues(dumpElement, userVar);
    }
}
