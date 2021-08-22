import { MD5 } from "crypto-js";

export function generateMapDataRevisionKey(worldName: string, worldPassNumber: number): string{
  return MD5(worldName + worldPassNumber).toString();
}
