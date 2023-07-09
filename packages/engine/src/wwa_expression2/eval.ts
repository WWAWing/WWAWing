import { Coord, MacroStatusIndex, PartsType } from "../wwa_data";
import { WWA } from "../wwa_main";
import * as Wwa from "./wwa";

export class EvalCalcWwaNodeGenerator {
  wwa: WWA;
  /** for文上限回数 */
  loop_limit: number;
  constructor(wwa: WWA) {
    this.wwa = wwa;
    /** 初期処理上限を10万回にする */
    this.loop_limit = 100000;
  }

  public evalWwaNodes(nodes: Wwa.WWANode[]) {
    return nodes.map((node) => {
      return this.evalWwaNode(node)
    })
  }

  public evalWwaNode(node: Wwa.WWANode) {
    if(node.type === "BlockStatement" && Array.isArray(node.value) && node.value.length === 0 ) {
      return;
    }
    const evalNode = new EvalCalcWwaNode(this);
    evalNode.evalWwaNode(node)
  }

  public updateLoopLimit(limit: number) {
    this.loop_limit = limit;
  }
}


// UNDONE: boolean 値の取り扱い方法については未定

export class EvalCalcWwaNode {
  generator: EvalCalcWwaNodeGenerator;
  /** ループ処理で使用するフラグ */
  private for_id: {
    i: number,
    j: number,
    k: number,
    loopCount: number,
    /** break/continue管理フラグ */
    break_flag: boolean;
    continue_flag: boolean;
  }


  constructor(generator: EvalCalcWwaNodeGenerator) {
    this.generator = generator;
    this.for_id = {
      i: null,
      j: null,
      k: null,
      loopCount: 0,
      break_flag: false,
      continue_flag: false
    }
  }

  private evalWwaNodes(nodes: Wwa.WWANode[]) {
    return nodes.map((node) => {
      return this.evalWwaNode(node)
    })
  }
  
  public evalWwaNode(node: Wwa.WWANode) {
    /** break/continueフラグが立っていたら処理しない */
    if(this.for_id.break_flag || this.for_id.continue_flag) {
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
      case "CallDefinedFunction":
        return this.callDefinedFunction(node);
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

  /** 関数の呼び出し */
  callDefinedFunction(node: Wwa.CallDefinedFunction) {
    const func = this.generator.wwa.getUserScript(node.functionName);
    if(func === null) {
      throw new Error(`未定義の関数が呼び出されました: ${node.functionName}`);
    }
    this.evalWwaNode(func);
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
    this.for_id.continue_flag = true;
  }

  /** break文を処理する */
  breakStatement(node: Wwa.Break) {
    // TODO: node.labelを活用したい
    /** Breakフラグを立てる */
    this.for_id.break_flag = true;
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
      if(this.for_id.loopCount > this.generator.loop_limit) {
        throw new Error("処理回数が多すぎます！\n上限値は LOOPLIMIT で変えられます。")
      }
      /** breakフラグが立っていたらそれ以降は処理しない */
      if(this.for_id.break_flag) {
        break;
      }
      if(!this.evalWwaNode(node.test)) {
        break;
      }
      this.evalWwaNodes(node.body);
      /** continueフラグを解除する */
      this.for_id.continue_flag = false;
    }
    /** for文処理の繰り返し部分ここまで */

    /** for文終了後に呼ばれる処理 */
    this.for_id.break_flag = false;
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

  /**
   * 関数実行時に引数が不足しているかチェックする
   * @param length 
   * @param node 
   */
  private _checkArgsLength(length: number, node: Wwa.AnyFunction) {
    if(node.value.length < length) {
      throw new Error(`関数 ${node.functionName} の引数が不足しています！`);
    }
  }
  
  /** 任意の特殊関数を実行する */
  evalAnyFunction(node: Wwa.AnyFunction) {
    const game_status = this.generator.wwa.getGameStatus();
    switch(node.functionName) {
      case "SOUND": {
        this._checkArgsLength(1, node);
        // SOUNDは引数を一つだけ取る
        const soundNumber = this.evalWwaNode(node.value[0]);
        // 曲を鳴らす
        this.generator.wwa.playSound(soundNumber);
        break;
      }
      case "SAVE": {
        this._checkArgsLength(1, node);
        // SAVEは引数を一つだけ取る
        const saveNumber = Boolean(this.evalWwaNode(node.value[0]));
        this.generator.wwa.disableSave(saveNumber);
        break;
      }
      case "LOG": {
        this._checkArgsLength(1, node);
        // 指定した引数の文字列をログ出力する
        const value = this.evalWwaNode(node.value[0]);
        console.log(value);
        break;
      }
      case "ABLE_CHANGE_SPEED": {
        this._checkArgsLength(1, node);
        const isAbleChangeSpeed = Boolean(this.evalWwaNode(node.value[0]));
        this.generator.wwa.speedChangeJudge(isAbleChangeSpeed);
        break;
      }
      case "SET_SPEED": {
        this._checkArgsLength(1, node);
        const gameSpeedValue = Number(this.evalWwaNode(node.value[0]));
        this.generator.wwa.setPlayerSpeedIndex(gameSpeedValue);
        break;
      }
      case "CHANGE_GAMEOVER_POS": {
        this._checkArgsLength(2, node);
        const gameover_pos = {
          x: Number(this.evalWwaNode(node.value[0])),
          y: Number(this.evalWwaNode(node.value[1]))
        }
        if(gameover_pos.x < 0 || gameover_pos.x >= this.generator.wwa.getMapWidth() || gameover_pos.y < 0 || gameover_pos.y > this.generator.wwa.getMapWidth()) {
          throw new Error("マップの範囲外が指定されています!");
        }
        this.generator.wwa.setGameOverPosition(new Coord(gameover_pos.x, gameover_pos.y));
        break;
      }
      case "DEL_PLAYER": {
        this._checkArgsLength(1, node);
        const isDelPlayer = Boolean(this.evalWwaNode(node.value[0]));
        this.generator.wwa.setDelPlayer(isDelPlayer);
        break;
      }
      case "RESTART_GAME": {
        this.generator.wwa.restartGame();
        break;
      }
      case "URL_JUMPGATE":
        throw new Error("URL_JUMPGATE 関数は調整中のためご利用になれません");
      case "HIDE_STATUS": {
        this._checkArgsLength(2, node);
        const target = Number(this.evalWwaNode(node.value[0]));
        const isHide = Boolean(this.evalWwaNode(node.value[1]));
        this.generator.wwa.hideStatus(target, isHide);
        break;
      }
      case "PARTS": {
        this._checkArgsLength(2, node);
        const srcID = Number(this.evalWwaNode(node.value[0]));
        const destID = Number(this.evalWwaNode(node.value[1]));
        let partsType = node.value[2]? Number(this.evalWwaNode(node.value[2])): 0;
        let onlyThisSight = node.value[3]? Boolean(this.evalWwaNode(node.value[3])): true;
        const PARTS_TYPE_LIST = [PartsType.OBJECT, PartsType.MAP];
        if(srcID < 0 || destID < 0 ) {
          throw new Error("パーツ番号が不正です");
        }
        else if(!PARTS_TYPE_LIST.includes(partsType)) {
          throw new Error("パーツ種別が不明です");
        }
        // TODO: パーツ番号が最大値を超えていないかチェックする
        this.generator.wwa.replaceParts(srcID, destID, partsType, onlyThisSight);
        break;
      }
      case "EFFECT": {
        // ex) EFFECT(6, 9, 15)
        this._checkArgsLength(1, node);
        const waitTime = Number(this.evalWwaNode(node.value[0]));
        if (waitTime < 0) {
            throw new Error("待ち時間は0以上の整数でなければなりません。");
        }
        if (waitTime === 0) {
            this.generator.wwa.stopEffect();
            return;
        }
        const coords: Coord[] = [];
        for(let i = 1; i < node.value.length; i+=2) {
          const cropX = Number(this.evalWwaNode(node.value[i]));
          if(cropX < 0) {
            throw new Error("画像のパーツ座標指定は0以上の整数でなければなりません。");
          }
          if(i+1 === node.value.length) {
            throw new Error("画像のパーツ座標指定で、Y座標が指定されていません。");
          }
          const cropY = Number(this.evalWwaNode(node.value[i+1]));
          if (cropY < 0) {
            throw new Error("画像のパーツ座標指定は0以上の整数でなければなりません。");
          }
          coords.push(new Coord(cropX, cropY));
        }
        this.generator.wwa.setEffect(waitTime, coords);
        break;
      }
      case "CHANGE_PLAYER_IMAGE": {
        this._checkArgsLength(2, node);
        const x = Number(this.evalWwaNode(node.value[0]));
        const y = Number(this.evalWwaNode(node.value[1]));
        const coord = new Coord(x, y);
        this.generator.wwa.setPlayerImgCoord(coord);
        break;
      }
      case "HAS_ITEM": {
        this._checkArgsLength(1, node);
        const targetItemID = Number(this.evalWwaNode(node.value[0]));
        const hasIem = game_status.itemBox.includes(targetItemID);
        return hasIem;
      }
      case "REMOVE_ITEM": {
        this._checkArgsLength(1, node);
        const targetItemID = Number(this.evalWwaNode(node.value[0]));
        const isRemoveAll = node.value[1] ? this.evalWwaNode(node.value[1]) === 1 : false;
        for (let idx = 0; idx < game_status.itemBox.length; idx++) {
          const item = game_status.itemBox[idx];
          if (targetItemID === item) {
            this.generator.wwa.setPlayerGetItem(idx + 1, 0);
            if (!isRemoveAll) {
              break;
            }
          }
        }
      }
      case "MOVE": 
        this._checkArgsLength(1, node);
        {
          const direction = Number(this.evalWwaNode(node.value[0]))
          if(direction <= 0 || direction > 9) {
            throw Error("MOVEの移動先は2/4/6/8で指定してください！")
          }
          this.generator.wwa.movePlayer(direction);
          this.generator.wwa.movePlayer(direction);
        }
        break;
      case "IS_PLAYER_WAITING_MESSAGE": {
        return this.generator.wwa.isPlayerWaitingMessage();
      }
      default:
        throw new Error("未定義の関数が指定されました: "+node.functionName);
    }
  }

  /**
   * m[0][0] のようなObject/mapパーツを左辺値に代入する際の処理
   * 右辺値取得は evalArray2D で処理する
   **/
  partsAssignment(node: Wwa.PartsAssignment) {
    const game_status = this.generator.wwa.getGameStatus();
    const x = this.evalWwaNode(node.destinationX);
    const y = this.evalWwaNode(node.destinationY);
    const value = this.evalWwaNode(node.value);
    const partsKind = node.partsKind === "map"? PartsType.MAP: PartsType.OBJECT;
    this.generator.wwa.appearPartsEval(game_status.playerCoord, x, y, value, partsKind);
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
    this.generator.wwa.setPlayerGetItem(idx, itemID);
    return 0;
  }

  evalMessage(node: Wwa.Msg) {
    const value = this.evalWwaNode(node.value);
    const showString = isNaN(value)? value: value.toString();
    this.generator.wwa.reserveMessageDisplayWhenShouldOpen(showString);
    return 0;
  }

  evalJumpgate(node: Wwa.Jumpgate) {
    const x = this.evalWwaNode(node.x);
    const y = this.evalWwaNode(node.y);
    if(isNaN(x) || isNaN(y)) {
      throw new Error(`飛び先の値が数値になっていません。 x=${x} / y=${y}`);
    }
    this.generator.wwa.forcedJumpGate(x, y);
  }

  evalRandom(node: Wwa.Random) {
    const maxRandValue = this.evalWwaNode(node.value);
    return Math.floor(Math.random()*maxRandValue);
  }

  evalSetSpecialParameter(node: Wwa.SpecialParameterAssignment) {
    const right = this.evalWwaNode(node.value);
    if(!this.generator.wwa || isNaN(right)) {
      return 0;
    }
    switch(node.kind) {
      case 'PX':
        this.generator.wwa.jumpSpecifiedXPos(right);
        return 0;
      case 'PY':
        this.generator.wwa.jumpSpecifiedYPos(right);
        return 0;
      case 'AT':
        this.generator.wwa.setPlayerStatus(MacroStatusIndex.STRENGTH, right, false);
        return 0;
      case 'DF':
        this.generator.wwa.setPlayerStatus(MacroStatusIndex.DEFENCE, right, false);
        return 0;
      case 'GD':
        this.generator.wwa.setPlayerStatus(MacroStatusIndex.GOLD, right, false);
        return 0;
      case 'HP':
        this.generator.wwa.setPlayerStatus(MacroStatusIndex.ENERGY, right, false);
        return 0;
      case 'HPMAX':
        this.generator.wwa.setPlayerEnergyMax(right);
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
      case 'LOOPLIMIT':
        this.generator.updateLoopLimit(this.evalWwaNode(node.value));
        return 0;
      default:
        console.error("未実装の要素です: "+node.kind);
        return 0;
    }
  }

  evalSetUserVariable(node: Wwa.UserVariableAssignment) {
    const right = this.evalWwaNode(node.value);
    if(!this.generator.wwa || isNaN(right) || node.index.type !== "Number") {
      return 0;
    }
    const userVarIndex: number = node.index.value;
    this.generator.wwa.setUserVar(userVarIndex, right);
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
    const game_status = this.generator.wwa.getGameStatus();
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
        /** 現在時刻を更新する */
        this.generator.wwa.setNowPlayTime();
        return game_status.playTime;
      case "PDIR":
        return game_status.playerDirection
      /** for文用（暫定） */
      case 'i':
        return this.for_id.i;
      case 'j':
        return this.for_id.j;
      case 'k':
        return this.for_id.k;
      case 'LOOPLIMIT':
        return this.generator.loop_limit;
      default:
        throw new Error("このシンボルは取得できません")
    }
  }

  evalArray1D(node: Wwa.Array1D) {
    const index: Wwa.Number = <Wwa.Number>node.index0;
    const userVarIndex: number = index.value;
    const game_status = this.generator.wwa.getGameStatus();
    switch (node.name) {
      case "v":
        return this.generator.wwa.getUserVar(userVarIndex);
      case "ITEM":
        if(game_status.itemBox[userVarIndex] === undefined) {
          throw new Error("ITMEの添字に想定外の値が入っています。: "+userVarIndex);
        }
        return game_status.itemBox[userVarIndex];
      default:
        throw new Error("このシンボルは取得できません")
    }
  }

  /**
   * o[1][2]のようなobject/mapパーツを右辺値に持ってきた際に該当座標のパーツ番号を返す
   * 左辺値代入は partsAssignment で処理する
   **/
  evalArray2D(node: Wwa.Array2D) {
    switch(node.name) {
      case "m":
      case "o":
        const x = this.evalWwaNode(node.index0);
        const y = this.evalWwaNode(node.index1);
        const partsType = node.name === 'o'? PartsType.OBJECT: PartsType.MAP;
        const partsID = this.generator.wwa.getPartsID(new Coord(x, y), partsType);
        return partsID;
      default:
        throw new Error("このシンボルは取得できません")
    }
  }

  evalNumber(node: Wwa.Number) {
    return node.value;
  }
}
