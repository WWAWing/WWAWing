import { Coord, MacroStatusIndex, PartsType } from "../wwa_data";
import { WWA } from "../wwa_main";
import * as Wwa from "./wwa";

// UNDONE: boolean 値の取り扱い方法については未定

export class EvalCalcWwaNode {
  wwa: WWA;
  /** ループ処理で使用するフラグ */
  for_id: {
    i: number,
    j: number,
    k: number,
    loopCount: number
  }
  /** break/continue管理フラグ */
  break_flag: boolean;
  continue_flag: boolean;

  constructor(wwa: WWA) {
    this.wwa = wwa;
    this.for_id = {
      i: null,
      j: null,
      k: null,
      loopCount: 0
    }
    this.break_flag = false;
  }

  evalWwaNodes(nodes: Wwa.Node[]) {
    return nodes.map((node) => {
      return this.evalWwaNode(node)
    })
  }
  
  evalWwaNode(node: Wwa.Node) {
    /** break/continueフラグが立っていたら処理しない */
    if(this.break_flag || this.continue_flag) {
      return;
    }
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
      case "Msg":
        return this.evalMessage(node);
      case "ItemAssignment":
        return this.itemAssignment(node);
      case "IfStatement":
        return this.ifStatement(node);
      case "BlockStatement":
        return this.blockStatement(node);
      case "PartsAssignment":
        return this.partsAssignment(node);
      case "ForStatement":
        return this.forStateMent(node);
      case "AnyFunction":
        return this.evalAnyFunction(node);
      case "Break":
        return this.breakStatement(node);
      case "Continue":
        return this.contunueStatment(node);
      case "UpdateExpression":
        return this.updateExpression(node);
      default:
        throw new Error("未定義または未実装のノードです");
    }
  }

  /** i++ などが実行された時の処理 */
  updateExpression(node: Wwa.UpdateExpression) {
    if(node.argument.type === "Symbol") {
      const value = this.evalSymbol(node.argument);
      const addValue = (()=>{
        switch(node.operator) {
          case '++':
            return value+1;
          case '--':
            return value-1;
          default:
            throw new Error("想定外のOperatorが渡されました :"+node.operator);
        }
      })()
      const SpecialParameterAssignment: Wwa.SpecialParameterAssignment = {
        type: "SpecialParameterAssignment",
        kind: <any>node.argument.name,
        value: {
          type: "Number",
          value: addValue
        }
      }
      this.evalSetSpecialParameter(SpecialParameterAssignment);
    }
    else {
      console.log(node);
      throw new Error("node.argument.typeがSymbolではありません。:"+node.argument.type);
    }
  }

  /** Continue文を処理する */
  contunueStatment(node: Wwa.Continue) {
    // TODO: node.labelを活用したい
    this.continue_flag = true;
  }

  /** break文を処理する */
  breakStatement(node: Wwa.Break) {
    // TODO: node.labelを活用したい
    /** Breakフラグを立てる */
    this.break_flag = true;
  }

  /** for(i=0; i<10; i=i+1) のようなFor文を処理する */
  forStateMent(node: Wwa.ForStatement) {
    const init: Wwa.SpecialParameterAssignment = <Wwa.SpecialParameterAssignment>node.init;

    /** for文初期化時に呼ばれる関数 */
    const initStatment = () => {
      /** 初期化チェックを行う */
      switch(init.kind) {
        case 'i':
          if(this.for_id.i !== null) {
            throw new Error("iの値が既に外側のforループで使われています。");
          }
          break;
        case 'j':
          if(this.for_id.j !== null) {
            throw new Error("jの値が既に外側のforループで使われています。");
          }
          break;
        case 'k':
          if(this.for_id.k !== null) {
            throw new Error("kの値が既に外側のforループで使われています。");
          }
          break;
        default:
          throw new Error("予想外の変数がfor文内で使用されました :"+init.kind);
      }
      /** 添字の初期化処理を実施する */
      this.evalWwaNode(node.init);
    }

    /** for文処理の繰り返し部分 */
    for(initStatment(); this.evalWwaNode(node.test); this.evalWwaNode(node.update)) {
      this.for_id.loopCount++;
      if(this.for_id.loopCount > 10) {
        throw new Error("処理回数が多すぎます！")
      }
      /** breakフラグが立っていたらそれ以降は処理しない */
      if(this.break_flag) {
        break;
      }
      if(!this.evalWwaNode(node.test)) {
        break;
      }
      this.evalWwaNodes(node.body);
      /** continueフラグを解除する */
      this.continue_flag = false;
    }
    /** for文処理の繰り返し部分ここまで */

    /** for文終了後に呼ばれる処理 */
    this.break_flag = false;
    switch(init.kind) {
      case 'i':
        this.for_id.i = null;
        break;
      case 'j':
        this.for_id.j = null;
        break;
      case 'k':
        this.for_id.k = null;
        break;
    }
  }
  
  /** SOUNDの用な任意の特殊関数を実行する */
  evalAnyFunction(node: Wwa.AnyFunction) {
    switch(node.functionName) {
      case "SOUND":
        // SOUNDは引数を一つだけ取る
        const soundNumber = this.evalWwaNode(node.value[0]);
        // 曲を鳴らす
        this.wwa.playSound(soundNumber);
        break;
      case "SAVE":
        // SAVEは引数を一つだけ取る
        const saveNumber = Boolean(this.evalWwaNode(node.value[0]));
        this.wwa.disableSave(saveNumber);
        break;
      case "LOG":
        // 指定した引数の文字列をログ出力する
        const value = this.evalWwaNode(node.value[0]);
        console.log(value);
        break;
      case "ABLE_CHANGE_SPEED":
        const isAbleChangeSpeed = Boolean(this.evalWwaNode(node.value[0]));
        this.wwa.speedChangeJudge(isAbleChangeSpeed);
        break;
      case "SET_SPEED":
        const gameSpeedValue = Number(this.evalWwaNode(node.value[0]));
        this.wwa.setPlayerSpeedIndex(gameSpeedValue);
        break;
      case "CHANGE_GAMEOVER_POS":
        const gameover_pos = {
          x: Number(this.evalWwaNode(node.value[0])),
          y: Number(this.evalWwaNode(node.value[1]))
        }
        if(gameover_pos.x < 0 || gameover_pos.x >= this.wwa.getMapWidth() || gameover_pos.y < 0 || gameover_pos.y > this.wwa.getMapWidth()) {
          throw new Error("マップの範囲外が指定されています!");
        }
        this.wwa.setGameOverPosition(new Coord(gameover_pos.x, gameover_pos.y));
        break;
      case "DEL_PLAYER":
        const isDelPlayer = Boolean(this.evalWwaNode(node.value[0]));
        this.wwa.setDelPlayer(isDelPlayer);
        break;
      default:
        throw new Error("未定義の関数が指定されました: "+node.functionName);
    }
  }

  /** m[0][0] のような二次元はを処理する */
  partsAssignment(node: Wwa.PartsAssignment) {
    const game_status = this.wwa.getGameStatus();
    const x = this.evalWwaNode(node.destinationX);
    const y = this.evalWwaNode(node.destinationY);
    const value = this.evalWwaNode(node.value);
    const partsKind = node.partsKind === "map"? PartsType.MAP: PartsType.OBJECT;
    this.wwa.appearPartsEval(game_status.playerCoord, x, y, value, partsKind);
  }

  blockStatement(node: Wwa.BlockStatement) {
    this.evalWwaNodes(node.value);
  }

  ifStatement(node: Wwa.IfStatement) {
    const ifResult = this.evalWwaNode(node.test);
    if(ifResult) {
      // IFがTRUEの場合には以下を実行する
      this.evalWwaNode(node.consequent);
    }
    // ELSEの場合には以下条件を繰り返し実行する
    else if(node.alternate) {
      this.evalWwaNode(node.alternate);
    }
    return 0;
  }

  /**
   * 保持しているITMEを変更する
   * @param node 
   * @returns 
   */
  itemAssignment(node: Wwa.ItemAssignment) {
    const idx = this.evalWwaNode(node.itemBoxPosition1to12);
    const itemID = this.evalWwaNode(node.value);
    this.wwa.setPlayerGetItem(idx, itemID);
    return 0;
  }

  evalMessage(node: Wwa.Msg) {
    const value = this.evalWwaNode(node.value);
    const showString = isNaN(value)? value: value.toString();
    this.wwa.generatePageAndReserveExecution(showString, false, false);
    return 0;
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
      /** for文用; 左辺値iに値を代入する場合: ex) i=i+2 */
      case 'i':
        this.for_id.i = this.evalWwaNode(node.value);
        return 0;
      case 'j':
        this.for_id.j = this.evalWwaNode(node.value);
        return 0;
      case 'k':
        this.for_id.k = this.evalWwaNode(node.value);
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
      case ">":
        return left > right;
      case ">=":
        return left >= right;
      case "<":
        return left < right;
      case "<=":
        return left >= right;
      case "==":
        return left == right;
      case "!=":
        return left != right;
      default:
        throw new Error("存在しない単項演算子です");
    }
  }

  evalSymbol(node: Wwa.Symbol) {
    const game_status = this.wwa.getGameStatus();
    switch(node.name) {
      case "X":
      case "Y":
        // UNDONE: WWAから値を取得する
        return 0;
      case "PX":
        return game_status.playerCoord.x;
      case "PY":
        return game_status.playerCoord.y;
      case "AT":
        return game_status.totalStatus.strength;
      case "DF":
        return game_status.totalStatus.defence;
      case "GD":      
        return game_status.totalStatus.gold;
      case "HP":      
        return game_status.totalStatus.energy;
      case "HPMAX":
        return game_status.energyMax;
      case "STEP":
        return game_status.moveCount;
      case "TIME":
        return game_status.playTime;
      case "PRID":
        return game_status.playerDirection
      /** for文用（暫定） */
      case 'i':
        return this.for_id.i;
      case 'j':
        return this.for_id.j;
      case 'k':
        return this.for_id.k;
      default:
        throw new Error("このシンボルは取得できません")
    }
  }

  evalArray1D(node: Wwa.Array1D) {
    const index: Wwa.Number = <Wwa.Number>node.index0;
    const userVarIndex: number = index.value;
    const game_status = this.wwa.getGameStatus();
    switch (node.name) {
      case "v":
        return this.wwa.getUserVar(userVarIndex);
      case "ITEM":
        if(game_status.itemBox[userVarIndex] === undefined) {
          throw new Error("ITMEの添字に想定外の値が入っています。: "+userVarIndex);
        }
        return game_status.itemBox[userVarIndex];
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
