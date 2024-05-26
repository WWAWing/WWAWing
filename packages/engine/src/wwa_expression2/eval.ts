import { SystemMessage } from "@wwawing/common-interface";
import { BattleEstimateParameters, Coord, Face, MacroStatusIndex, PartsType, Position, WWAConsts, speedList  } from "../wwa_data";
import { WWA } from "../wwa_main";
import * as Wwa from "./wwa";
import { Literal } from "./wwa";
import { PARTS_TYPE_LIST } from "./utils";
import { evalLengthFunction } from "./functions/length";
import { getPlayerCoordPx, getPlayerCoordPy } from "./symbols";

const operatorOperationMap: {
  [ KEY in "=" | "+=" | "-=" | "*=" | "/=" ]: (currentValue: number, value: number) => number
} = Object.freeze({
  "=": (_, value) => value,
  "+=": (currentValue, value) => currentValue + value,
  "-=": (currentValue, value) => currentValue - value,
  "*=": (currentValue, value) => currentValue * value,
  "/=": (currentValue, value) => currentValue / value
});


export class EvalCalcWwaNodeGenerator {
  wwa: WWA;
  /** for文上限回数 */
  loop_limit: number;

  state: {
    /** パーツから呼び出した場合ならオブジェクトあり，さもなくば undefined */
    readonly triggerParts?: {
      /** パーツ番号 */
      id?: number,
      /** パーツ種類 */
      type?: PartsType,
      /** 呼び出したパーツの座標 */
      position?: Coord,
    }
    /** アイテム取得時の計算ならオブジェクトあり, さもなくば undefined. */
    readonly earnedItem?: {
      /** 使用・取得したアイテムのID */
      partsId?: number,
      /** 使用・取得したアイテムの位置 */
      itemPos1To12?: number
    }
    /** 戦闘ダメージのための計算ならオブジェクトあり, さもなくば undefined */
    readonly battleDamageCalculation?: {
      /** 計算結果に中断が含まれている */
      aborted?: boolean;
      /**
       * 戦闘予測用パラメータ.
       * 値が設定されている場合、 処理中に HP, AT_TOTAL, DF_TOTAL, GD, ENEMY_HP, ENEMY_AT, ENEMY_DF, ENEMY_GD を読む時はこの値を使用します。
       * なお、戦闘予測中にHPを書き換えた場合は、実際のプレイヤーの生命力が書き換わるので注意してください。
       * undefined の場合は実際の戦闘です。
       */
      estimatingParams?: BattleEstimateParameters;
    }
  }

  constructor(wwa: WWA) {
    this.wwa = wwa;
    /** 初期処理上限を10万回にする */
    this.loop_limit = 100000;
    this.state = {}
  }

  public setTriggerParts(partsId: number, partsType: PartsType, position: Coord) {
    this.state = { ...this.state, triggerParts: { id: partsId, type: partsType, position } };
  }

  public clearTriggerParts() {
    this.state = { ...this.state, triggerParts: undefined };
  }

  /**
   * Item関連のReadOnly値をセットする
   * @param item_id 使用・取得したITEMのID
   * @param item_pos 使用・取得したITEMのID [1,12]
   */
  public setEarnedItem(partsId: number, itemPos1To12: number) {
    this.state = { ...this.state, earnedItem: { partsId, itemPos1To12 } };
  }

  public clearEarnedItem() {
    this.state = { ...this.state, earnedItem: undefined };
  }

  public setBattleDamageCalculationMode(estimatingParams: BattleEstimateParameters) {
    this.state = { ...this.state, battleDamageCalculation: { estimatingParams } }
  }

  public clearBattleDamageCalculationMode() {
    this.state = { ...this.state, battleDamageCalculation: undefined }
  }

  public evalWwaNodes(nodes: Wwa.WWANode[]) {
    // BlockStatement で囲ってそれを実行
    return this.evalWwaNode({ type: "BlockStatement", value: nodes });
  }

  public evalWwaNode(node: Wwa.WWANode) {
    if(node.type === "BlockStatement" && Array.isArray(node.value) && node.value.length === 0 ) {
      return;
    }
    try {
      const evalNode = new EvalCalcWwaNode(this);
      return evalNode.evalWwaNode(node);
    } catch (caughtThing) {
      if (caughtThing instanceof ReturnedInformation || caughtThing instanceof ExitInformation) {
        return caughtThing.value;
      } else {
        throw caughtThing;
      }
    }
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

  public evalWwaNodes(nodes: Wwa.WWANode[]) {
    let result: any /* HACK */ = undefined;
    nodes.forEach((node) => {
      result = this.evalWwaNode(node)
    });
    return result;
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
      case "Array3D":
        return this.evalArray3D(node);
      case "Literal":
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
        return this.wrapCallFunction(node, node => this.evalAnyFunction(node));
      case "CallDefinedFunction":
        return this.wrapCallFunction(node, node => this.callDefinedFunction(node));
      case "Break":
        return this.breakStatement(node);
      case "Return":
        throw new ReturnedInformation(this.returnStatement(node));
      case "Continue":
        return this.contunueStatment(node);
      case "UpdateExpression":
        return this.updateExpression(node);
      case "LogicalExpression":
        return this.logicalExpression(node);
      case "TemplateLiteral":
        return this.convertTemplateLiteral(node);
      case "ConditionalExpression":
        return this.convertConditionalExpression(node);
      case "Property":
        return this.property(node);
      case "ObjectExpression":
        return this.objectExpression(node);
      case "ArrayExpression":
        return this.arrayExpression(node);
      default:
        console.log(node);
        throw new Error("未定義または未実装のノードです");
    }
  }

  private wrapCallFunction<N extends Wwa.WWANode, RV>(node: N, callFunction: (node: N) => RV): RV {
    try {
      return callFunction(node);
    } catch (caughtThing) {
      if (caughtThing instanceof ReturnedInformation) {
        // return で関数が強制終了した場合のケア
        return caughtThing.value;
      } else {
        // 一般エラー (ExitInformationも含む)
        throw caughtThing;
      }
    }    
  }

  /** 関数の呼び出し */
  callDefinedFunction(node: Wwa.CallDefinedFunction) {
    const func = this.generator.wwa.getUserScript(node.functionName);
    if(func === null) {
      throw new Error(`未定義の関数が呼び出されました: ${node.functionName}`);
    }
    return this.evalWwaNode(func);
  }

  /** i++ などが実行された時の処理. 現在後置インクリメントのみ対応しています. */
  updateExpression(node: Wwa.UpdateExpression) {
    if (node.argument.type !== "Array1D" && node.argument.type !== "Array2D" && node.argument.type !== "Symbol") {
      throw new Error(`node.argument.typeが インクリメント/デクリメントできる対象ではありません。: ${node.argument.type}`);
    }
    const update = (value: number) => {
      switch(node.operator) {
        case '++':
          return value + 1;
        case '--':
          return value - 1;
        default:
          throw new Error("想定外のOperatorが渡されました :"+node.operator);
      }
    }
    const value = this.evalWwaNode(node.argument);
    const updatedValue = update(value);
    const valueLiteral = { type: "Literal", value: updatedValue } as const;

    switch(node.argument.type) {
      case "Array1D": {
        if (node.argument.name ==="v") {
          this.evalSetUserVariable({
            type: "UserVariableAssignment",
            index: node.argument.index0,
            value: valueLiteral
          })
        } else if (node.argument.name === "ITEM") {
          this.itemAssignment({
            type: "ItemAssignment",
            itemBoxPosition1to12: node.argument.index0,
            value: valueLiteral
          })
        } else {
          throw new Error(`このリテラルはインクリメント/デクリメントできません: ${node.argument.type}`)
        }
        break;
      }
      case "Array2D": {
        const params = {
          type: "PartsAssignment",
          destinationX: node.argument.index0,
          destinationY: node.argument.index1,
          value: valueLiteral,
          operator: "="
        } as const satisfies Partial<Wwa.PartsAssignment>;
        if(node.argument.name === "m") {
          this.partsAssignment({ ...params, partsKind: "map" });
        } else if(node.argument.name === "o") {
          this.partsAssignment({ ...params, partsKind: "object" });
        } else {
          throw new Error(`このリテラルはインクリメント/デクリメントできません: ${node.argument.type}`)
        }
        break;
      }
      case "Symbol": {
        const SpecialParameterAssignment: Wwa.SpecialParameterAssignment = {
          type: "SpecialParameterAssignment",
          // @ts-expect-error 型解決する
          kind: node.argument.name,
          value: valueLiteral,
        };
        this.evalSetSpecialParameter(SpecialParameterAssignment);
        break;
      }
    }
    return value; // 今実装されているのは後置インクリメントなので更新前の値を返す
  }

  /** && や || などの論理式が来た時の対応 */
  logicalExpression(node: Wwa.LogicalExpression) {
    const left = this.evalWwaNode(node.left);
    const right = this.evalWwaNode(node.right);
    switch(node.operator) {
      case '||':
        return (left || right);
      case '&&':
        return (left && right);
      default:
        throw new Error("存在しない論理式です!: "+node.operator);
    }
  }

  /** テンプレートリテラル構文の解析をする */
  convertTemplateLiteral(node: Wwa.TemplateLiteral) {
    const expressions = node.expressions.map((exp) => {
      return this.evalWwaNode(exp);
    })
    const quasis = node.quasis.map((q: Wwa.TemplateElement) => {
      return q.value.cooked;
    })
    let return_string = "";
    quasis.forEach((q, id) => {
      return_string += q;
      if(expressions[id] !== undefined) {
        return_string += expressions[id];
      }
    });
    return return_string;
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

  // return文を処理する。 ここでは値を返すだけ。
  returnStatement(node: Wwa.Return) {
    return this.evalWwaNode(node.argument);
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
        return soundNumber;
      }
      case "SAVE": {
        this._checkArgsLength(1, node);
        // SAVEは引数を一つだけ取る
        const saveNumber = Boolean(this.evalWwaNode(node.value[0]));
        this.generator.wwa.disableSave(saveNumber);
        return saveNumber;
      }
      case "LOG": {
        this._checkArgsLength(1, node);
        // 指定した引数の文字列をログ出力する
        const value = this.evalWwaNode(node.value[0]);
        console.log(value);
        return undefined;
      }
      case "ABLE_CHANGE_SPEED": {
        this._checkArgsLength(1, node);
        const isAbleChangeSpeed = Boolean(this.evalWwaNode(node.value[0]));
        this.generator.wwa.speedChangeJudge(isAbleChangeSpeed);
        return isAbleChangeSpeed;
      }
      case "SET_SPEED": {
        this._checkArgsLength(1, node);
        const gameSpeedValue = Number(this.evalWwaNode(node.value[0]));
        this.generator.wwa.setPlayerSpeedIndex(gameSpeedValue);
        return undefined;
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
        return undefined;
      }
      case "DEL_PLAYER": {
        this._checkArgsLength(1, node);
        const isDelPlayer = Boolean(this.evalWwaNode(node.value[0]));
        this.generator.wwa.setDelPlayer(isDelPlayer);
        return undefined;
      }
      case "RESTART_GAME": {
        this.generator.wwa.restartGame();
        return undefined;
      }
      case "URL_JUMPGATE":
        throw new Error("URL_JUMPGATE 関数は調整中のためご利用になれません");
      case "HIDE_STATUS": {
        this._checkArgsLength(2, node);
        const target = Number(this.evalWwaNode(node.value[0]));
        const isHide = Boolean(this.evalWwaNode(node.value[1]));
        this.generator.wwa.hideStatus(target, isHide);
        return undefined;
      }
      case "PARTS": {
        this._checkArgsLength(2, node);
        const srcID = Number(this.evalWwaNode(node.value[0]));
        const destID = Number(this.evalWwaNode(node.value[1]));
        let partsType = node.value[2]? Number(this.evalWwaNode(node.value[2])): 0;
        let onlyThisSight = node.value[3]? Boolean(this.evalWwaNode(node.value[3])): false;
        if(srcID < 0 || destID < 0 ) {
          throw new Error("パーツ番号が不正です");
        }
        else if(!PARTS_TYPE_LIST.includes(partsType)) {
          throw new Error("パーツ種別が不明です");
        }
        // TODO: パーツ番号が最大値を超えていないかチェックする
        this.generator.wwa.replaceParts(srcID, destID, partsType, onlyThisSight);
        return undefined;
      }
      case "FACE": {
        this._checkArgsLength(6, node);
        const destPosX = Number(this.evalWwaNode(node.value[0]));
        const destPosY = Number(this.evalWwaNode(node.value[1]));
        const srcPosX = Number(this.evalWwaNode(node.value[2]));
        const srcPosY = Number(this.evalWwaNode(node.value[3]));
        const srcWidth = Number(this.evalWwaNode(node.value[4]));
        const srcHeight = Number(this.evalWwaNode(node.value[5]));
        if (
          destPosX < 0 || destPosY < 0 ||
          srcPosX < 0 || srcPosY < 0 ||
          srcWidth < 0 || srcHeight < 0
        ) {
          throw new Error("各引数は0以上の整数でなければなりません。");
        }
        this.generator.wwa.handleFaceFunction(new Face(
            new Coord(destPosX, destPosY),
            new Coord(srcPosX, srcPosY),
            new Coord(srcWidth, srcHeight)
          )
        );
        return undefined;
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
        return undefined;
      }
      case "CHANGE_PLAYER_IMAGE": {
        this._checkArgsLength(2, node);
        const x = Number(this.evalWwaNode(node.value[0]));
        const y = Number(this.evalWwaNode(node.value[1]));
        const coord = new Coord(x, y);
        this.generator.wwa.setPlayerImgCoord(coord);
        return undefined;
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
        let removedItemNum = 0;
        for (let idx = 0; idx < game_status.itemBox.length; idx++) {
          if (targetItemID === game_status.itemBox[idx]) {
            this.generator.wwa.setPlayerGetItem(idx + 1, 0);
            removedItemNum++;
            if (!isRemoveAll) {
              return removedItemNum;
            }
          }
        }
        return removedItemNum;
      }
      case "MOVE": {
          this._checkArgsLength(1, node);
          const direction = Number(this.evalWwaNode(node.value[0]))
          if(direction <= 0 || direction > 9) {
            throw Error("MOVEの移動先は2/4/6/8で指定してください！")
          }
          this.generator.wwa.movePlayer(direction);
          this.generator.wwa.movePlayer(direction);
          return 0;
      }
      case "IS_PLAYER_WAITING_MESSAGE": {
        return this.generator.wwa.isPlayerWaitingMessage();
      }
      case "GET_UNIXTIME":
        return Math.floor(new Date().getTime()/1000);
      case "GET_DATE_YEAR":
        return (new Date()).getFullYear();
      case "GET_DATE_MONTH":
        return (new Date()).getMonth()+1;
      case "GET_DATE_DAY":
        return (new Date()).getDate();
      case "GET_DATE_HOUR":
        return (new Date()).getHours();
      case "GET_DATE_MINUTES":
        return (new Date()).getMinutes();
      case "GET_DATE_SECONDS":
        return (new Date()).getSeconds();
      case "GET_DATE_MILLISECONDS":
        return (new Date()).getMilliseconds();
      case "GET_DATE_WEEKDAY":
        return (new Date()).getDay();
      /** ユーザー定義名前付き変数をconsole.log出力する */
      case "SHOW_USER_DEF_VAR":
        {
          console.log(this.generator.wwa.getAllUserNameVar());
          return undefined;
        }
      /** システムメッセージを変更する */
      case "CHANGE_SYSMSG": {
        this._checkArgsLength(1, node);
        const rawTarget = this.evalWwaNode(node.value[0]);
        const message =  node.value.length >= 2 ? this.evalWwaNode(node.value[1]) : undefined;
        const target = this.resolveSystemMessageKeyFromMacroArg(rawTarget);
        if (!target) {
          throw new Error("このIDのシステムメッセージは未定義です。");
        }
        if (
          typeof message === "number" ||
          typeof message === "string" ||
          typeof message === "boolean"
         ) {
          this.generator.wwa.overwriteSystemMessage(target, String(message));
        } else if (typeof message === "undefined" || message === null) {
          this.generator.wwa.overwriteSystemMessage(target, undefined);
        } else {
          throw new Error("この値は文字列に変換できないため、システムメッセージを表示できません。");
        }
        break;
      }
      case "PICTURE": {
        this._checkArgsLength(1, node);
        const layerNumber = Number(this.evalWwaNode(node.value[0]));
        const propertyDefinition = node.value.length >= 2 ? this.evalWwaNode(node.value[1]) : undefined;
        if (propertyDefinition === undefined) {
          this.generator.wwa.deletePictureRegistry(layerNumber);
          return;
        }
        if (typeof propertyDefinition === "object") {
          this.generator.wwa.setPictureRegistryFromObject(layerNumber, propertyDefinition);
        } else if (typeof propertyDefinition === "string") {
          // TODO パーツ座標は本来なら実行元パーツの座標にすべきだが、イベント関数では判別できない。
          this.generator.wwa.setPictureRegistryFromRawText(layerNumber, propertyDefinition);
        } else {
          throw new Error("ピクチャのプロパティ定義は文字列あるいはオブジェクトである必要があります。")
        }
        break;
      }
      case "PICTURE_FROM_PARTS": {
        this._checkArgsLength(2, node);
        const layerNumber = Number(this.evalWwaNode(node.value[0]));
        const propertyPartsNumber = Number(this.evalWwaNode(node.value[1]));
        const propertyPartsType = node.value.length >= 3 ? Number(this.evalWwaNode(node.value[2])) : PartsType.OBJECT;
        if (!PARTS_TYPE_LIST.includes(propertyPartsType)) {
          throw new Error("パーツ種別が不明です");
        }
        const gameStatus = this.generator.wwa.getGameStatus();
        // 実行元パーツ座標はプレイヤーの座標として評価する
        this.generator.wwa.setPictureRegistry(layerNumber, propertyPartsNumber, propertyPartsType, gameStatus.playerCoord);
        break;
      }
      /** 絶対値を返す関数 */
      case "ABS": {
        this._checkArgsLength(1, node);
        const value = Number(this.evalWwaNode(node.value[0]));
        return Math.abs(value);
      }
      /** ゲームオーバー座標取得関数たち */
      case "GET_GAMEOVER_POS_X": {
        const pos = this.generator.wwa.getGemeOverPosition();
        return pos.x;
      }
      case "GET_GAMEOVER_POS_Y":{
        const pos = this.generator.wwa.getGemeOverPosition();
        return pos.y;
      }
      /** ダメージカスタマイズ関数中で、戦闘を即座に打ち切る その他の場合は何もしない*/
      case "ABORT_BATTLE": {
        if (this.generator.state.battleDamageCalculation) {
          this.generator.state.battleDamageCalculation.aborted = true;
        }
        throw new ExitInformation("ABORT_BATTLE");
      }
      case "EXIT": 
        throw new ExitInformation("EXIT", this.evalWwaNode(node.value[0]));
      case "GET_IMG_POS_X": {
        this._checkArgsLength(1, node);
        const parts_id = Number(this.evalWwaNode(node.value[0]));
        const parts_type_number = (node.value[1] !== undefined)?
          Number(this.evalWwaNode(node.value[1])):
          0;
        const parts_type = parts_type_number === 0? PartsType.OBJECT: PartsType.MAP;
        if(parts_type === PartsType.OBJECT) {
          const is_first_motion: boolean = (node.value[2] !== undefined)?
            Number(this.evalWwaNode(node.value[2])) === 0:
            true;
          // 物体パーツの情報を取得する
          const obj_info = this.generator.wwa.getObjectInfo(parts_id);
          const ims_pos = is_first_motion? obj_info[WWAConsts.ATR_X]: obj_info[WWAConsts.ATR_X2];
          return Math.floor(ims_pos / WWAConsts.CHIP_SIZE);
        }
        else if(parts_type === PartsType.MAP) {
          // 背景パーツの情報を取得する
          const map_info = this.generator.wwa.getMapInfo(parts_id);
          const ims_pos = map_info[WWAConsts.ATR_X];
          return Math.floor(ims_pos / WWAConsts.CHIP_SIZE);
        }
        throw new Error("GET_IMG_POS_X: 指定したIDのパーツのTypeが異常です。");
      }
      case "GET_IMG_POS_Y": {
        this._checkArgsLength(1, node);
        const parts_id = Number(this.evalWwaNode(node.value[0]));
        const parts_type_number = (node.value[1] !== undefined)?
          Number(this.evalWwaNode(node.value[1])):
          0;
        const parts_type = parts_type_number === 0? PartsType.OBJECT: PartsType.MAP;
        if(parts_type === PartsType.OBJECT) {
          const is_first_motion: boolean = (node.value[2] !== undefined)?
            Number(this.evalWwaNode(node.value[2])) === 0:
            true;
          // 物体パーツの情報を取得する
          const obj_info = this.generator.wwa.getObjectInfo(parts_id);
          const ims_pos = is_first_motion? obj_info[WWAConsts.ATR_Y]: obj_info[WWAConsts.ATR_Y2];
          return Math.floor(ims_pos / WWAConsts.CHIP_SIZE);
        }
        else if(parts_type === PartsType.MAP) {
          // 背景パーツの情報を取得する
          const map_info = this.generator.wwa.getMapInfo(parts_id);
          const ims_pos = map_info[WWAConsts.ATR_Y];
          return Math.floor(ims_pos / WWAConsts.CHIP_SIZE);
        }
        throw new Error("GET_IMG_POS_Y: 指定したIDのパーツのTypeが異常です。");
      }
      case "LENGTH": {
        this._checkArgsLength(1, node);
        const targetValue = this.evalWwaNode(node.value[0]);
        return evalLengthFunction(targetValue);
      }
      default:
        throw new Error("未定義の関数が指定されました: "+node.functionName);
    }
  }

  private resolveSystemMessageKeyFromMacroArg(target: any): SystemMessage.Key | undefined {
    if (typeof target === "string") {
      // メッセージコードとして解決しようとする
      return SystemMessage.stringIsKey(target) ? target : undefined;
    } else if (typeof target === "number") {
      return SystemMessage.findKeyByCode(target);
    } else {
      return undefined;
    }
  }


  /**
   * m[0][0] のようなObject/mapパーツを左辺値に代入する際の処理
   * 右辺値取得は evalArray2D で処理する
   **/
  partsAssignment(node: Wwa.PartsAssignment) {
    const gameStatus = this.generator.wwa.getGameStatus();
    const x = this.evalWwaNode(node.destinationX);
    const y = this.evalWwaNode(node.destinationY);
    if (typeof x !== "number" || typeof y !== "number") {
      throw new Error(`座標は数値で指定してください (${x}, ${y})`)
    }
    // 範囲外で例外を投げる用
    new Position(this.generator.wwa, x, y);

    const partsType = node.partsKind === "map"? PartsType.MAP: PartsType.OBJECT;
    const currentValue = this.resolveParts(partsType, x, y);
    const value = this.evalWwaNode(node.value);
    switch (node.operator) {
      case "=":
      case "+=":
      case "-=":
      case "*=":
      case "/=": {
        // | 0 で小数点以下無視
        const result = operatorOperationMap[node.operator](currentValue, value) | 0;
        if (result < 0) {
          throw new Error(`負値のパーツ番号 ${result} は代入できません`);
        }
        this.generator.wwa.appearPartsEval(gameStatus.playerCoord, `${x}`, `${y}`, result, partsType);
        break;
      }
      default:
        throw new Error(`演算子 ${node.operator} は partsAssignment では使えません`);
    }
  }

  private resolveParts(partsType: PartsType, x: number, y: number) {
    const gameStatus = this.generator.wwa.getGameStatus();
    switch(partsType) {
      case PartsType.MAP:
        return gameStatus.wwaData.map[y][x];
      case PartsType.OBJECT:
        return gameStatus.wwaData.mapObject[y][x];
      default:
        throw new Error("存在しないPartsTypeです", partsType);
    }
  }

  blockStatement(node: Wwa.BlockStatement) {
    return this.evalWwaNodes(node.value);
  }

  /** ifステートメントを実行する */
  ifStatement(node: Wwa.IfStatement) {
    const ifResult = this.evalWwaNode(node.test);
    if (ifResult) {
      // IFがTRUEの場合には以下を実行する
      return this.evalWwaNode(node.consequent);
    }
    // ELSEの場合には以下を実行する
    if (node.alternate) {
      return this.evalWwaNode(node.alternate);
    }
    return undefined;
  }

  /** 三項演算子を実行する */
  convertConditionalExpression(node: Wwa.ConditionalExpression) {
    const ifResult = this.evalWwaNode(node.test);
    const target = ifResult? node.consequent: node.alternate;
    const value = this.evalWwaNode(target)
    return value;
  }

  property(node: Wwa.Property) {
    return [this.evalWwaNode(node.key), this.evalWwaNode(node.value)];
  }

  objectExpression(node: Wwa.ObjectExpression) {
    return Object.fromEntries(
      // TODO もし properties に Properties 以外の Node が混入したら？
      node.properties.map((property) => this.evalWwaNode(property))
    );
  }

  arrayExpression(node: Wwa.ArrayExpression) {
    return node.elements.map((element) => this.evalWwaNode(element));
  }

  /**
   * 保持しているITEMを変更する
   * ITEM[0] に対する代入で、任意位置挿入ができます。
   * @param node 
   * @returns 
   */
  itemAssignment(node: Wwa.ItemAssignment) {
    const idx = this.evalWwaNode(node.itemBoxPosition1to12);
    if(typeof idx !== "number" || idx < 0 || idx > 12 ) {
      throw new Error("ITEMの添字に想定外の値が入っています。0以上12以下の添字を指定してください。: "+ idx);
    }
    const itemID = this.evalWwaNode(node.value);
    switch (node.operator) {
      case "=": {
        // | 0 で小数点以下無視
        this.generator.wwa.setPlayerGetItem(idx, itemID | 0);
        break;
      }
      case "+=":
      case "-=":
      case "*=":
      case "/=": {
        if (idx === 0) {
          throw new Error("複合代入では ITEM[0] への操作はできません")
        }
        const currentItemId = this.generator.wwa.getGameStatus().itemBox[idx - 1] ;
        // | 0 で小数点以下無視
        const result = operatorOperationMap[node.operator](currentItemId, itemID) | 0;
        if (result < 0) {
          throw new Error(`負値のパーツ番号 ${result} は代入できません`);
        }
        this.generator.wwa.setPlayerGetItem(idx, result);
        break;
      }
      default:
        throw new Error(`演算子 ${node.operator} は itemAssignment では使えません`);
    }

    return undefined;
  }

  evalMessage(node: Wwa.Msg) {
    const value = this.evalWwaNode(node.value);
    const showString = isNaN(value)? value: value.toString();
    this.generator.wwa.handleMsgFunction(showString);
    return undefined;
  }

  evalJumpgate(node: Wwa.Jumpgate) {
    const x = this.evalWwaNode(node.x);
    const y = this.evalWwaNode(node.y);
    if(isNaN(x) || isNaN(y)) {
      throw new Error(`飛び先の値が数値になっていません。 x=${x} / y=${y}`);
    }
    this.generator.wwa.forcedJumpGate(x, y);
    return undefined;
  }

  evalRandom(node: Wwa.Random) {
    const maxRandValue = this.evalWwaNode(node.value);
    return Math.floor(Math.random()*maxRandValue);
  }

  evalSetSpecialParameter(node: Wwa.SpecialParameterAssignment) {
    const right = this.evalWwaNode(node.value);
    if(!this.generator.wwa || isNaN(right)) {
      return right;
    }
    const currentValue = this.evalSymbol({
      type: "Symbol",
      name: node.kind
    })
    const targetValue = (()=>{
      switch(node.operator) {
        case "+=":
          return currentValue + right;
        case "-=":
          return currentValue - right;
        case "*=":
          return currentValue * right;
        case "/=":
          return currentValue / right;
        case "=":
        default:
          return right;
      }
    })()
    switch(node.kind) {
      case 'PX':
        this.generator.wwa.jumpSpecifiedXPos(targetValue);
        return targetValue;
      case 'PY':
        this.generator.wwa.jumpSpecifiedYPos(targetValue);
        return targetValue;
      case 'AT':
        this.generator.wwa.setPlayerStatus(MacroStatusIndex.STRENGTH, targetValue, false);
        return targetValue;
      case 'DF':
        this.generator.wwa.setPlayerStatus(MacroStatusIndex.DEFENCE, targetValue, false);
        return targetValue;
      case 'GD':
        this.generator.wwa.setPlayerStatus(MacroStatusIndex.GOLD, targetValue, false);
        return targetValue;
      case 'HP':
        this.generator.wwa.setPlayerStatus(MacroStatusIndex.ENERGY, targetValue, false);
        return targetValue;
      case 'HPMAX':
        this.generator.wwa.setPlayerEnergyMax(targetValue);
        return targetValue;
      /** for文用; 左辺値iに値を代入する場合: ex) i=i+2 */
      case 'i':
        this.for_id.i = this.evalWwaNode(node.value);
        return this.for_id.i;
      case 'j':
        this.for_id.j = this.evalWwaNode(node.value);
        return this.for_id.j;
      case 'k':
        this.for_id.k = this.evalWwaNode(node.value);
        return this.for_id.k;
      case 'LOOPLIMIT': {
        const loopLimit = this.evalWwaNode(node.value);
        this.generator.updateLoopLimit(loopLimit);
        return loopLimit;
      }
      default:
        console.error("未実装の要素です: "+node.kind);
        return undefined;
    }
  }

  evalSetUserVariable(node: Wwa.UserVariableAssignment) {
    if(node.index.length > 1) {
      const right = this.evalWwaNode(node.value[0]);
      const userVarIndexes = node.index.map((x) => this.evalWwaNode(x));
      this.generator.wwa.setUserVarIndexes(userVarIndexes, right, node.operator);
      return;
    }
    else {
      // TODO: 互換性保持の暫定措置
      const right = this.evalWwaNode(node.value[0]);
      if(!this.generator.wwa) {
        return right;
      }
      // TODO: 後で直す
      const userVarIndex = this.evalWwaNode(node.index[0]);
      this.generator.wwa.setUserVar(userVarIndex, right, node.operator);
      return right;
    }
  }

  evalUnaryOperation(node: Wwa.UnaryOperation) {
    switch(node.operator) {
      case "+":
        return this.evalWwaNode(node.argument);
      case "-":
        return - this.evalWwaNode(node.argument);
      case "!":
        return !this.evalWwaNode(node.argument);
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
        return left <= right;
      case "==":
        return left == right;
      case "!=":
        return left != right;
      default:
        throw new Error("存在しない単項演算子です");
    }
  }

  evalSymbol(node: Wwa.Symbol) {
    const gameStatus = this.generator.wwa.getGameStatus();
    const enemyStatus = this.generator.wwa.getEnemyStatus();
    switch(node.name) {
      case "X":
        return this.generator.state.triggerParts?.position.x ?? gameStatus.playerCoord.x;
      case "Y":
        return this.generator.state.triggerParts?.position.y ?? gameStatus.playerCoord.y;
      case "ID":
        return this.generator.state.triggerParts?.id ?? -1;
      case "TYPE":
        return this.generator.state.triggerParts?.type ?? -1;
      case "PX":
        return gameStatus.playerCoord.x;
      case "PY":
        return gameStatus.playerCoord.y;
      case "AT":
        return gameStatus.bareStatus.strength;
      case "AT_TOTAL":
        // 戦闘予測の場合は戦闘予測用ステータスで計算       
        return this.generator.state.battleDamageCalculation?.estimatingParams?.playerStatus.strength ?? gameStatus.totalStatus.strength;
      case "DF":
        return gameStatus.bareStatus.defence;
      case "DF_TOTAL":
        // 戦闘予測の場合は戦闘予測用ステータスで計算       
        return this.generator.state.battleDamageCalculation?.estimatingParams?.playerStatus.defence ?? gameStatus.totalStatus.defence;
      case "GD":      
        // 戦闘予測の場合は戦闘予測用ステータスで計算       
        return this.generator.state.battleDamageCalculation?.estimatingParams?.playerStatus.gold ?? gameStatus.totalStatus.gold;
      case "HP":
        // 戦闘予測の場合は戦闘予測用ステータスで計算
        return this.generator.state.battleDamageCalculation?.estimatingParams?.playerStatus.energy ?? gameStatus.totalStatus.energy;
      case "HPMAX":
        return gameStatus.energyMax;
      case "STEP":
        return gameStatus.moveCount;
      case "TIME":
        return gameStatus.playTime;
      case "PDIR":
        return gameStatus.playerDirection
      /** for文用（暫定） */
      case 'i':
        return this.for_id.i;
      case 'j':
        return this.for_id.j;
      case 'k':
        return this.for_id.k;
      case 'LOOPLIMIT':
        return this.generator.loop_limit;
      case 'ITEM_ID':
        return this.generator.state.earnedItem?.partsId ?? -1;
      case 'ITEM_POS':
        return this.generator.state.earnedItem?.itemPos1To12 ?? -1;
      case 'ENEMY_HP':
        // 戦闘予測の場合は戦闘予測用HPで計算       
        return this.generator.state.battleDamageCalculation?.estimatingParams?.enemyStatus.energy ?? (typeof enemyStatus === 'number'? -1 : enemyStatus.energy);
      case 'ENEMY_AT':
        // 戦闘予測の場合は戦闘予測用HPで計算       
        return this.generator.state.battleDamageCalculation?.estimatingParams?.enemyStatus.strength ?? (typeof enemyStatus === 'number'? -1 : enemyStatus.strength);
      case 'ENEMY_DF':
        // 戦闘予測の場合は戦闘予測用HPで計算       
        return this.generator.state.battleDamageCalculation?.estimatingParams?.enemyStatus.defence ?? (typeof enemyStatus === 'number'? -1 : enemyStatus.defence);
      case 'ENEMY_GD':
        // 戦闘予測の場合は戦闘予測用HPで計算       
        return this.generator.state.battleDamageCalculation?.estimatingParams?.enemyStatus.gold ?? (typeof enemyStatus === 'number'? -1 : enemyStatus.gold);
      case 'PLAYER_PX':
        return getPlayerCoordPx(gameStatus.playerCoord.x, gameStatus.cameraCoord.x);
      case 'PLAYER_PY':
        return getPlayerCoordPy(gameStatus.playerCoord.y, gameStatus.cameraCoord.y);
      case 'MOVE_SPEED':
        return speedList[gameStatus.gameSpeedIndex];
      case 'MOVE_FRAME_TIME':
        return WWAConsts.CHIP_SIZE / speedList[gameStatus.gameSpeedIndex];
      default:
        throw new Error("このシンボルは取得できません")
    }
  }

  evalArray1D(node: Wwa.Array1D) {
    const userVarIndex = this.evalWwaNode(node.index0);
    if (typeof userVarIndex !== "number") {
      switch(node.name) {
        case "v":
          return this.generator.wwa.getUserNameVar(userVarIndex);
        default:
          throw new Error("このシンボルは取得できません");
      }
    }
    const game_status = this.generator.wwa.getGameStatus();
    switch (node.name) {
      case "v":
        return this.generator.wwa.getUserVar(userVarIndex);
      case "ITEM":
        if (userVarIndex < 1 || userVarIndex > 12) {
          throw new Error("ITEMの添字に想定外の値が入っています。1以上12以下の添字を指定してください。: "+userVarIndex);
        }
        return game_status.itemBox[userVarIndex - 1];
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
        if(typeof x !== "number" || typeof y !== "number") {
          throw new Error(`座標は数値で指定してください (${x}, ${y})`)
        }
        // 範囲外で例外を投げる用
        new Position(this.generator.wwa, x, y);
        const partsType = node.name === 'o'? PartsType.OBJECT: PartsType.MAP;
        const partsID = this.generator.wwa.getPartsID(new Coord(x, y), partsType);
        return partsID;
      case "v":
        const userNameKey = (<Literal>node.index0).value;
        const userNameValue = this.generator.wwa.getUserNameVar(userNameKey);
        if(!Array.isArray(userNameValue) && !(typeof userNameValue === 'object')) {
          throw new Error(`指定したユーザー定義変数: v["${userNameKey}"] は配列ではありません`)
        }
        const userNameRightKey = this.evalWwaNode(node.index1);
        return userNameValue[userNameRightKey];
      default:
        throw new Error("このシンボルは取得できません")
    }
  }

  // 3次元配列はユーザ定義名前変数のみ使用可能
  evalArray3D(node: Wwa.Array3D) {
    const indexes = [node.index0, node.index1, node.index2].map((x) => this.evalWwaNode(x));
    const userNameValue = this.generator.wwa.getUserNameVar(indexes[0]);
    return userNameValue[indexes[1]][indexes[2]];
  }

  evalNumber(node: Wwa.Literal) {
    return node.value;
  }
}

/**
 * return が呼び出された場合に throw されるインスタンスのクラス
 * 以降の処理を打ち切って関数の外に出るための情報。
 */
class ReturnedInformation {
  // HACK: evalWwaNode の型つけが any になっているのでそれに準じる形で妥協。
  // evalWwaNode の型つけは改善されるべき。
  constructor(public value?: any) {}
}

/**
 * スクリプト強制終了系の関数が呼ばれた場合に throw されるインスタンスのクラス
 * 能動的な取り消しであることを示すために JavaScript の Error は使わない。
 */
class ExitInformation {
  // HACK: evalWwaNode の型つけが any になっているのでそれに準じる形で妥協。
  // evalWwaNode の型つけは改善されるべき。
  constructor(public reason: "ABORT_BATTLE" | "EXIT", public value?: any) {}
}
