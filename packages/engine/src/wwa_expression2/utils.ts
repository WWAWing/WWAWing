import { PartsType } from "../wwa_data";

export const PARTS_TYPE_LIST = [PartsType.OBJECT, PartsType.MAP];

/**
 * 0 に限りなく近く、 0 に丸めるべきか判定する関数です。
 * SIN, COS, TAN の三角関数で180度を指定した場合、円周率同士の算出で誤差が生じます。
 * その誤差が原因で、限りなく 0 に近いものの、扱いにくい値 (1.2246467991473532e-16) が算出されます。
 * この場合、 true として判定されることを想定しています。
 */
export const isLowerThanEpsilon = (value: number) => Math.abs(value) < 1e-10;
