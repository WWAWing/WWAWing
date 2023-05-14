import { MacroStatusIndex } from "../wwa_data";
import { WWA } from "../wwa_main";
import * as Wwa from "./wwa";

// UNDONE: boolean 値の取り扱い方法については未定

export class EvalCalcWwaNode {
  wwa: WWA;
  constructor(wwa: WWA) {
    this.wwa = wwa;
  }
  
  evalWwaNode(node: Wwa.Node) {
    switch (node.type) {
      case "UnaryOperation":
        return this.evalUnaryOperation(node);
      case "BinaryOperation":
        return this.evalBinaryOperation(node);
      case "Symbol":
        return this.evalSymbol(node);
      case "Array1D":
        return this.evalArray1D(node);
      case "Array2D":
        return this.evalArray2D(node);
      case "Number":
        return this.evalNumber(node);
      case "UserVariableAssignment":
        return this.evalSetUserVariable(node);
      case "SpecialParameterAssignment":
        return this.evalSetSpecialParameter(node);
      case "Random":
        return this.evalRandom(node);
      case "Jumpgate":
        return this.evalJumpgate(node);
      default:
        throw new Error("未定義または未実装のノードです:\n"+node.type);
    }
  }

  evalJumpgate(node: Wwa.Jumpgate) {
    const x = this.evalWwaNode(node.x);
    const y = this.evalWwaNode(node.y);
    if(isNaN(x) || isNaN(y)) {
      throw new Error(`飛び先の値が数値になっていません。 x=${x} / y=${y}`);
    }
    this.wwa.forcedJumpGate(x, y);
  }

  evalRandom(node: Wwa.Random) {
    const maxRandValue = this.evalWwaNode(node.value);
    return Math.floor(Math.random()*maxRandValue);
  }

  evalSetSpecialParameter(node: Wwa.SpecialParameterAssignment) {
    const right = this.evalWwaNode(node.value);
    if(!this.wwa || isNaN(right)) {
      return 0;
    }
    switch(node.kind) {
      case 'PX':
        this.wwa.jumpSpecifiedXPos(right);
        return 0;
      case 'PY':
        this.wwa.jumpSpecifiedYPos(right);
        return 0;
      case 'AT':
        this.wwa.setPlayerStatus(MacroStatusIndex.STRENGTH, right, false);
        return 0;
      case 'DF':
        this.wwa.setPlayerStatus(MacroStatusIndex.DEFENCE, right, false);
        return 0;
      case 'GD':
        this.wwa.setPlayerStatus(MacroStatusIndex.GOLD, right, false);
        return 0;
      case 'HP':
        this.wwa.setPlayerStatus(MacroStatusIndex.ENERGY, right, false);
        return 0;
      case 'HPMAX':
        this.wwa.setPlayerEnergyMax(right);
        return 0;
      default:
        console.error("未実装の要素です: "+node.kind);
        return 0;
    }
  }

  evalSetUserVariable(node: Wwa.UserVariableAssignment) {
    const right = this.evalWwaNode(node.value);
    if(!this.wwa || isNaN(right) || node.index.type !== "Number") {
      return 0;
    }
    const userVarIndex: number = node.index.value;
    this.wwa.setUserVar(userVarIndex, right);
    return 0;
  }

  evalUnaryOperation(node: Wwa.UnaryOperation) {
    switch(node.operator) {
      case "+":
        return this.evalWwaNode(node.argument);
      case "-":
        return - this.evalWwaNode(node.argument);
      default:
          throw new Error("存在しない単項演算子です");
    }
  }

  evalBinaryOperation(node: Wwa.BinaryOperation) {
    const left = this.evalWwaNode(node.left);
    const right = this.evalWwaNode(node.right);
    switch(node.operator) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        return right === 0 ? 0 : Math.floor(left / right);
      case "%":
        return right === 0 ? 0 :left % right;
      default:
        throw new Error("存在しない単項演算子です");
    }
  }

  evalSymbol(node: Wwa.Symbol) {
    const player_pos = this.wwa.getPlayerPositon().getPartsCoord();
    const player_status = this.wwa.getPlayerStatus();
    switch(node.name) {
      case "ITEM":
      case "X":
      case "Y":
        // UNDONE: WWAから値を取得する
        return 0;
      case "PX":
        return player_pos.x;
      case "PY":
        return player_pos.y;
      case "AT":
        return player_status.at;
      case "DF":
        return player_status.df;
      case "GD":      
        return player_status.gd;
      case "HP":      
        return player_status.hp;
      case "HPMAX":
        return player_status.hpmax;
      default:
        throw new Error("このシンボルは取得できません")
    }
  }

  evalArray1D(node: Wwa.Array1D) {
    const index: Wwa.Number = <Wwa.Number>node.index0;
    const userVarIndex: number = index.value;
    switch (node.name) {
      case "v":
        return this.wwa.getUserVar(userVarIndex);
      case "ITEM":
        // UNDONE: WWAから値を取得する
        return 0;
      default:
        throw new Error("このシンボルは取得できません")
    }
  }

  evalArray2D(node: Wwa.Array2D) {
    switch(node.name) {
      case "m":
      case "o":
      default:
        throw new Error("このシンボルは取得できません")
    }
  }

  evalNumber(node: Wwa.Number) {
    return node.value;
  }
}
