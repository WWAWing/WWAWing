import { parseType } from "./parsers";

export interface ValueAssignOperation {
  /**
   * 代入先
   * 数値の場合は指定添字のユーザ変数
   * ユーザ変数の添字は、最低限 NaN でないことしかバリデーションされていないので、
   * 代入先としてふさわしいかどうか受け取り側でバリデーションする必要があります。
   */
  asignee: "energy" | "energyMax" | "strength" | "defence" | "gold" | number;

  /**
   * 代入する値
   * この値はバリデーションされていないので、このオブジェクトを受け取った側で値を操作するときに
   * バリデーションを実行する必要があります。
   */
  rawValue: number;
}

export function generateValueAssignOperation(calcResult: number, assigneeExpression: string): ValueAssignOperation {
  const targetType = parseType(assigneeExpression);
  switch (targetType) {
    case 'VARIABLE':
      const variable = assigneeExpression.match(/^v\[(\d+)\]$/);
      const varNumber = parseInt(variable[1], 10);
      if (varNumber === null || isNaN(varNumber)) {
        throw new Error("ユーザ変数の添字のパースに失敗しました");
      }
      return { asignee: varNumber, rawValue: calcResult };
    case 'NUMBER':
      throw new Error('左辺値に定数は入れられません');
    case 'HP':
      return { asignee: "energy", rawValue: calcResult };
    case 'HPMAX':
      return { asignee: "energyMax", rawValue: calcResult };
    case 'AT':
      return { asignee: "strength", rawValue: calcResult };
    case 'DF':
      return { asignee: "defence", rawValue: calcResult };
    case 'GD':
      return { asignee: "gold", rawValue: calcResult };
    case 'STEP':
      throw new Error('左辺値に歩数は入れられません');
    case 'TIME':
      throw new Error('左辺値にプレイ時間は入れられません');
    case 'RAND':
      throw new Error('左辺値に乱数は入れられません');
  }
}
