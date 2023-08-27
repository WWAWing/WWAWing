export interface Config {
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
    defaultText: "効果音・ＢＧＭデータをロードしますか？",
    mapdataParams: {
      messageArea:"systemMessage",
      index: 2
    }
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
    mapdataParams: {
       messageArea: "systemMessage",
      index: 0,
    }
  },
  CONFIRM_USE_ITEM: {
    code: 204,
    defaultText: `このアイテムを使用します。
よろしいですか?`,
    mapdataParams: {
      messageArea: "message",
      index: 8,
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
    mapdataParams: {
        messageArea: "message",
        index: 5
    }
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
} as {[key in string]: Config});

export const keys = Object.keys(_systemMessage) as Key[];

// string と交差させないと keyof で number が乱入してくる
export type Key = (keyof typeof _systemMessage) & string;
export const Key = (
    keys
).reduce<Partial<{ [KEY in Key]: Key }>>(
  (prev, key) => ({
    ...prev,
    [key]: key,
  }),
  {}
) as { [K in Key]: Key };

/**
 * システムメッセージの設定
 * マクロで書き換え可能なもの + マップデータで変更できるものみ定義しています
 */
export const ConfigMap: {
  [KEY in Key]: Config;
} = _systemMessage;

export function stringIsKey(rawValue: string): rawValue is Key {
    return keys.some((key) => key === rawValue);
}

export function findKeyByCode(code: number): Key | undefined {
    for (let key of keys) {
      if (ConfigMap[key].code === code) {
        return key;
      }
    }
    return undefined;
}
