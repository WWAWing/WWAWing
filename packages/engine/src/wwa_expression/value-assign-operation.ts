import { parseType } from "./parsers";

export interface VariableAssignOperation {
  assignee: "variable";
  index: number;
  rawValue: number;
}

export interface CoordAssignOperation {
  assignee: "map" | "mapObject";
  x: number;
  y: number;
  rawValue: number;
}

export interface ItemAssignOperation {
  assignee: "item";
  boxIndex1to12: number;
  rawValue: number;
}

export interface NoExtraArgumentValueeAssignOperation {
  /**
   * 代入先
   * 数値の場合は指定添字のユーザ変数
   * ユーザ変数の添字は、最低限 NaN でないことしかバリデーションされていないので、
   * 代入先としてふさわしいかどうか受け取り側でバリデーションする必要があります。
   */
  assignee: "energy" | "energyMax" | "strength" | "defence" | "gold" | "moveCount" | "playerDirection";

  /**
   * 代入する値
   * この値はバリデーションされていないので、このオブジェクトを受け取った側で値を操作するときに
   * バリデーションを実行する必要があります。
   */
  rawValue: number;
}

export type ValueAssignOperation = VariableAssignOperation | CoordAssignOperation | ItemAssignOperation | NoExtraArgumentValueeAssignOperation;

export function generateValueAssignOperation(calcResult: number, assigneeExpression: string): ValueAssignOperation {
  const targetType = parseType(assigneeExpression)?.type;
  switch (targetType) {
    case 'VARIABLE': {
      const variable = assigneeExpression.match(/^v\[(\d+)\]$/);
      const varNumber = Number(variable[1]);
      if (varNumber === null || isNaN(varNumber)) {
        throw new Error("ユーザ変数の添字のパースに失敗しました");
      }
      return { assignee: "variable", index: varNumber, rawValue: calcResult };
    }
    case 'MAP': {
      const map = assigneeExpression.match(/^m\[(\d+)\]\[(\d+)\]$/);
      const x = Number(map[1]);
      const y = Number(map[2]);
      if( x === null || y === null || isNaN(x) || isNaN(y)) {
        throw new Error("背景パーツの添字のパースに失敗しました");
      }
      return { assignee: "map", x, y, rawValue: calcResult };
    }
    case 'OBJECT': {
      const object = assigneeExpression.match(/^o\[(\d+)\]\[(\d+)\]$/);
      const x = Number(object[1]);
      const y = Number(object[2]);
      if( x === null || y === null || isNaN(x) || isNaN(y)) {
        throw new Error("物体パーツの添字のパースに失敗しました");
      }
      return { assignee: "mapObject", x, y, rawValue: calcResult };
    }
    case 'ITEM': {
      const item = assigneeExpression.match(/^ITEM\[(\d+)\]$/);
      const boxIndex1to12 = Number(item[1]);
      if (boxIndex1to12 === null || isNaN(boxIndex1to12)) {
        throw new Error("アイテムの添字のパースに失敗しました");
      }
      return { assignee: "item", boxIndex1to12, rawValue: calcResult };
    }
    case 'ITEM_COUNT_ALL':
      throw new Error('左辺値に所持アイテム数は入れられません');
    case 'NUMBER':
      throw new Error('左辺値に定数は入れられません');
    case 'HP':
      return { assignee: "energy", rawValue: calcResult };
    case 'HPMAX':
      return { assignee: "energyMax", rawValue: calcResult };
    case 'AT':
      return { assignee: "strength", rawValue: calcResult };
    case 'AT_TOTAL':
      throw new Error('左辺値に合計攻撃力は入れられません');
    case 'AT_ITEMS':
      throw new Error('左辺値にアイテム攻撃力は入れられません');
    case 'DF':
      return { assignee: "defence", rawValue: calcResult };
    case 'DF_TOTAL':
      throw new Error('左辺値に合計防御力は入れられません');
    case 'DF_ITEMS':
      throw new Error('左辺値にアイテム防御力は入れられません');
    case 'GD':
      return { assignee: "gold", rawValue: calcResult };
    case 'STEP':
      return { assignee: "moveCount", rawValue: calcResult };
    case 'TIME':
      throw new Error('左辺値にプレイ時間は入れられません');
    case 'PX':
      // 将来的には PX も変更できるようにする (ジャンプゲート扱い)
      throw new Error('左辺値にプレイヤーX座標は入れられません');
    case 'PY':
      // 将来的には PY も変更できるようにする (ジャンプゲート扱い)
      throw new Error('左辺値にプレイヤーY座標は入れられません');
    case 'X':
      // 将来的には X も変更できるようにする (指定位置にパーツを出現x2扱い)
      throw new Error('左辺値にパーツX座標は入れられません');
    case 'Y':
      // 将来的には Y も変更できるようにする (指定位置にパーツを出現x2扱い)
      throw new Error('左辺値にパーツY座標は入れられません');
    case 'ID':
      // これも変更できてもいいかも (自身のパーツを同じパーツ種別内で置換する)
      throw new Error('左辺値にパーツ番号座標は入れられません');
    case 'TYPE':
      throw new Error('左辺値にパーツ種別は入れられません');
    case 'PDIR':
      return { assignee: "playerDirection", rawValue: calcResult };
    case 'RAND':
      throw new Error('左辺値に乱数は入れられません');
    case 'ITEM_COUNT':
      throw new Error('左辺値に所持アイテム数は入れられません');
    default:
      throw new Error('この文字列から代入操作オブジェクトは生成できません');
  }
}
