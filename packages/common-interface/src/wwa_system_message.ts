export interface SystemMessageConfig {
    code: number;
    defaultText: string;
    mapdataParams?: {
        messageArea: "message" | "systemMessage";
        index: number
    };
}

const _systemMessage = Object.freeze({
  CONFIRM_LOAD_SOUND: {
    code: 1,
    defaultText: "効果音・ＢＧＭデータをロードしますか？"
  },
  NO_MONEY: {
    code: 101,
    defaultText: "所持金がたりない。",
    mapdataParams: {
      messageArea: "message",
      index: 6,
    },
  },
  NO_ITEM: {
    code: 201,
    mapdataParams: {
      messageArea: "message",
      index: 7,
    },
    defaultText: "アイテムを持っていない。",
  },
  ITEM_BOX_FULL: {
    code: 202,
    defaultText: "これ以上、アイテムを持てません。",
    mapdataParams: {
      messageArea: "systemMessage",
      index: 1,
    },
  },
  ITEM_SELECT_TUTORIAL: {
    code: 203,
    defaultText: `このアイテムは%HOW_TO_USE_ITEM%ことで使用できます。
使用できるアイテムは色枠で囲まれます。`,
  },
  CONFIRM_USE_ITEM: {
    code: 204,
    defaultText: `このアイテムを使用します。
よろしいですか?`,
    mapdataParams: {
      messageArea: "systemMessage",
      index: 0,
    },
  },
  CANNOT_DAMAGE_MONSTER: {
    code: 301,
    defaultText: "相手の防御能力が高すぎる！",
  },
  CONFIRM_ENTER_URL_GATE: {
    code: 401,
    defaultText: `他のページにリンクします。
よろしいですか？`,
  },
  GAME_SPEED_CHANGED: {
    code: 501,
    defaultText: `移動速度を【%GAME_SPEED_NAME%】に切り替えました。
%HIGH_SPEED_MESSAGE%(%MAX_SPEED_INDEX%段階中%GAME_SPEED_INDEX%)
速度を落とすには%SPEED_DOWN_BUTTON%, 速度を上げるには%SPEED_UP_BUTTON%を押してください。`,
  },
  GAME_SPEED_CHANGE_DISABLED: {
    code: 502,
    defaultText: `ここでは移動速度を
変更できません。`,
  },
} as const);

export const systemMessageKeys = Object.keys(_systemMessage) as SystemMessageKey[];

export type SystemMessageKey = keyof typeof _systemMessage;
export const SystemMessageKey = (
    systemMessageKeys
).reduce<Partial<{ [KEY in SystemMessageKey]: SystemMessageKey }>>(
  (prev, key) => ({
    ...prev,
    [key]: key,
  }),
  {}
) as { [KEY in SystemMessageKey]: SystemMessageKey };

/**
 * システムメッセージの設定
 * マクロで書き換え可能なもの + マップデータで変更できるものみ定義しています
 */
export const SystemMessageConfigMap: {
  [KEY in SystemMessageKey]: SystemMessageConfig;
} = _systemMessage;
