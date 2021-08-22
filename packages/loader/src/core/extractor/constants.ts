export enum BytePosition {
  CHECK = 0x00, //  0
  VERSION = 0x02, //  2
  OLD_MAP_COUNT = 0x03, //  3
  OLD_OBJ_COUNT = 0x04, //  4
  OLD_PLAYER_X = 0x05, //  5
  OLD_PLAYER_Y = 0x06, //  6
  STATUS_ENERGY = 0x0a, // 10
  STATUS_STRENGTH = 0x0c, // 12
  STATUS_DEFENCE = 0x0e, // 14

  STATUS_GOLD = 0x10, // 16
  OLD_GAMEOVER_X = 0x12, // 18
  OLD_GAMEOVER_Y = 0x13, // 19
  OLD_ITEMBOX_TOP = 0x14, // 20

  STATUS_ENERGY_MAX = 0x20, // 32
  MAP_COUNT = 0x22, // 34
  OBJ_COUNT = 0x24, // 36
  PLAYER_X = 0x26, // 38
  PLAYER_Y = 0x28, // 40
  GAMEOVER_X = 0x2a, // 42
  GAMEOVER_Y = 0x2c, // 44
  MAP_SIZE = 0x2e, // 46

  MESSAGE_NUM = 0x30, // 48
  ITEMBOX_TOP = 0x3c, // 60

  MAPDATA_TOP = 0x5a, // 90
  OLD_MAPDATA_TOP = 0x64, //100
}
