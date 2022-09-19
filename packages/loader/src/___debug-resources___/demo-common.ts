
import { WWAData } from "@wwawing/common-interface";

export const EXTRACTING_MAPDATA_FILENAME = "wwamap.dat"; // 吸い出すファイル名

export const targetKeys: (keyof WWAData)[] = [
  "playerX",
  "playerY",
  "gameoverX",
  "gameoverY",
  "mapPartsMax",
  "objPartsMax",
  "statusEnergyMax",
  "statusEnergy",
  "statusStrength",
  "statusDefence",
  "statusGold",
  "mapWidth",
  "messageNum",
  "worldName",
  "mapCGName"
];
