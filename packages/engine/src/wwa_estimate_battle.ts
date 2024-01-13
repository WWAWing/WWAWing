import { WWA } from "./wwa_main";
import { Coord, Status, WWAConsts } from "./wwa_data";
import { Monster } from "./wwa_monster";

class EstimateDisplayElements {
    public elem: HTMLElement;

    public imgElem: HTMLDivElement;
    public statusElem: HTMLDivElement;

    public energyElem: HTMLDivElement;
    public strengthElem: HTMLDivElement;
    public defenceElem: HTMLDivElement;
    public damageElem: HTMLDivElement;
    public energyDispElem: HTMLSpanElement;
    public strengthDispElem: HTMLSpanElement;
    public defenceDispElem: HTMLSpanElement;
    public damageDispElem: HTMLSpanElement;

    constructor(public id: number, public imgFileName: string, public parent: HTMLDivElement) {
        this.elem = document.createElement("div");
        this.elem.classList.add("est");
        this.elem.setAttribute("id", "wwa-est-" + id);

        this.imgElem = document.createElement("div");
        this.imgElem.classList.add("est-img-wrapper");
        this.imgElem.style.backgroundImage = "url(" + this.imgFileName.replace("(", "\\(").replace(")", "\\)") + ")";

        this.statusElem = document.createElement("div");
        this.statusElem.classList.add("est-status-wrapper");

        this.energyElem = document.createElement("div");
        this.energyElem.classList.add("est-energy");
        this.energyDispElem = document.createElement("span");
        this.energyDispElem.classList.add("est-energy-disp");
        this.energyElem.appendChild(this.energyDispElem);
        this.statusElem.appendChild(this.energyElem);

        this.strengthElem = document.createElement("div");
        this.strengthElem.classList.add("est-strength");
        this.strengthDispElem = document.createElement("span");
        this.strengthDispElem.classList.add("est-strength-disp");
        this.strengthElem.appendChild(this.strengthDispElem);
        this.statusElem.appendChild(this.strengthElem);

        this.defenceElem = document.createElement("div");
        this.defenceElem.classList.add("est-defence");
        this.defenceDispElem = document.createElement("span");
        this.defenceDispElem.classList.add("est-defence-disp");
        this.defenceElem.appendChild(this.defenceDispElem);
        this.statusElem.appendChild(this.defenceElem);

        this.damageElem = document.createElement("div");
        this.damageElem.classList.add("est-damage");
        this.damageDispElem = document.createElement("span");
        this.damageDispElem.classList.add("est-damage-disp");
        this.damageElem.appendChild(this.damageDispElem);
        this.statusElem.appendChild(this.damageElem);

        this.elem.appendChild(this.imgElem);
        this.elem.appendChild(this.statusElem);
    }

    public hide(): void {
        this.elem.style.display = "none";
    }

    public show(): void {
        this.elem.style.display = "block";
    }

    public setResult(enemyImgPos: Coord, enemyStatus: Status, result: EstimatedBattleResult): void {
        this.imgElem.style.backgroundPosition = "-" + enemyImgPos.x + "px -" + enemyImgPos.y + "px";
        this.energyDispElem.textContent = "生命力 " + enemyStatus.energy;
        this.strengthDispElem.textContent = "攻撃力 " + enemyStatus.strength;
        this.defenceDispElem.textContent = "防御力 " + enemyStatus.defence;
        if (result.cannotDamageMonster) {
            this.damageDispElem.textContent = "攻撃無効";
        } else if (result.noSettled) {
            this.damageDispElem.textContent = "決着がつきません";
        } else if (result.isOverMaxTurn) {
            this.damageDispElem.textContent = "長期戦が予想されます";
        } else {
            this.damageDispElem.textContent = "予測ダメージ " + result.estimatedDamage;
        }
    }
}

export class BattleEstimateWindow {
    private _element: HTMLDivElement;
    private _edes: EstimateDisplayElements[];
    public constructor(private _wwa: WWA, private _imgFileName: string, private _parent: HTMLElement) {
        var ede: EstimateDisplayElements;
        this._element = document.createElement("div");
        this._element.setAttribute("id", "wwa-battle-estimate");
        this._element.style.display = "none";
        this._edes = [];

        for (var i = 0; i < WWAConsts.BATTLE_ESTIMATE_MONSTER_TYPE_MAX; i++) {
            ede = new EstimateDisplayElements(i, this._imgFileName, this._element);
            this._edes.push(ede);
            this._element.appendChild(ede.elem);
        }
        this._element.addEventListener("click", () => {
            this._wwa.hideBattleEstimateWindow();
        });
        this._parent.appendChild(this._element);
    }

    public update(
        playerStatus: Status,
        monsters: Monster[],
        calcDamagePlayerToEnemy: (playerStatus: Status, monster: Monster) => number,
        calcDamageEnemyToPlayer: (monster: Monster, playerStatus: Status) => number,
        usingDefaultDamageFunction: boolean
    ): void {
        // モンスターの種類が8種類を超える場合は、先頭の8種類のみ処理
        for (let i = 0; i < WWAConsts.BATTLE_ESTIMATE_MONSTER_TYPE_MAX; i++) {
            if (i >= monsters.length) {
                // 非表示処理
                this._edes[i].hide()
                continue;
            }
            const imgx = this._wwa.getObjectAttributeById(monsters[i].partsID, WWAConsts.ATR_X);
            const imgy = this._wwa.getObjectAttributeById(monsters[i].partsID, WWAConsts.ATR_Y);
            const imgPos = new Coord(imgx, imgy);
            const eng = this._wwa.getObjectAttributeById(monsters[i].partsID, WWAConsts.ATR_ENERGY);
            const str = this._wwa.getObjectAttributeById(monsters[i].partsID, WWAConsts.ATR_STRENGTH);
            const def = this._wwa.getObjectAttributeById(monsters[i].partsID, WWAConsts.ATR_DEFENCE);
            const enemyStatus = new Status(eng, str, def, 0);
            const result = calc(
                playerStatus,
                monsters[i],
                calcDamagePlayerToEnemy,
                calcDamageEnemyToPlayer,
                usingDefaultDamageFunction,
            );
            this._edes[i].setResult(imgPos, enemyStatus, result);

            this._edes[i].show();

        }
    }

    public show() {
        this._element.style.display = "block";
    }

    public hide() {
        this._element.style.display = "none";
    }
}

interface EstimatedBattleResult {
  noSettled?: boolean,
  isOverMaxTurn?: boolean,
  cannotDamageMonster?: boolean,
  estimatedDamage: number
}

// 戦闘結果を予測します。プレイヤーの生命力は考慮されない点に注意してください。
function calc(
    playerStatus: Status,
    monster: Monster,
    calcDamagePlayerToEnemy: (playerStatus: Status, monster: Monster) => number,
    calcDamageEnemyToPlayer: (monster: Monster, playerStatus: Status) => number,
    usingDefaultDamageFunction: boolean
 ): EstimatedBattleResult {
    const clonedMonster = monster.clone();

    let damage = 0;
    let turnLength = 0;
    let noDamageTurnLength = 0;

    // デフォルトダメージ関数を使っている場合の攻撃無効判定
    if(
        usingDefaultDamageFunction &&
        playerStatus.strength <= monster.status.defence &&
        playerStatus.defence >= monster.status.strength
    ) {
        return { cannotDamageMonster: true, estimatedDamage: 0 }
    }

    // FIXME: プレイヤー生命力などのステータスが計算式に入っている場合に正しく戦闘結果予測が動作しない
    // 生命力をシミュレーションする環境構築が必要
    // 根本的には、ダメージ関数については参照できる変数などのシンボルに制約を入れることになりそう
    while (1) {
        turnLength++;
        const playerToEnemyDamage = calcDamagePlayerToEnemy(playerStatus, clonedMonster);
        clonedMonster.status.energy -= playerToEnemyDamage;

        if (playerToEnemyDamage === 0) {
            noDamageTurnLength++;
        } else {
            noDamageTurnLength = 0;
        }
        if (clonedMonster.status.energy <= 0) {
            return { estimatedDamage: damage };
        } else if (noDamageTurnLength > WWAConsts.FIGHT_DRAW_TURN)  {
            return { noSettled: true, estimatedDamage: damage }
        } else if (turnLength > 20000) {
            return { isOverMaxTurn: true, estimatedDamage: 0 };
        }
        turnLength++;
        const enemyToPlayerDamage = calcDamageEnemyToPlayer(clonedMonster, playerStatus);
        if (enemyToPlayerDamage === 0) {
            noDamageTurnLength++;
        } else {
            noDamageTurnLength = 0;
        }
        damage += Math.max(0, enemyToPlayerDamage);
        if (noDamageTurnLength > WWAConsts.FIGHT_DRAW_TURN)  {
            return { noSettled: true, estimatedDamage: damage }
        } else if (turnLength > 20000) {
            return { isOverMaxTurn: true, estimatedDamage: 0 };
        }
    }
}
