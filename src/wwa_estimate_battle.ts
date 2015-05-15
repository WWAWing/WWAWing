/// <reference path="./wwa_data.ts" />

module wwa_estimate_battle {

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

        public setResult(enemyImgPos: wwa_data.Coord, enemyStatus: wwa_data.Status, result: EstimateResult): void {
            this.imgElem.style.backgroundPosition = "-" + enemyImgPos.x + "px -" + enemyImgPos.y + "px";
            this.energyDispElem.textContent = "生命力 " + enemyStatus.energy;
            this.strengthDispElem.textContent = "攻撃力 " + enemyStatus.strength;
            this.defenceDispElem.textContent = "防御力 " + enemyStatus.defence;
            if (result.isNoEffect) {
                this.damageDispElem.textContent = "攻撃無効";
            } else if (result.isOverMaxTurn) {
                this.damageDispElem.textContent = "長期戦が予想されます";
            } else {
                this.damageDispElem.textContent = "予想ダメージ " + result.damage;
            }
        }
    }

    export class BattleEstimateWindow {
        private _element: HTMLDivElement;
        private _edes: EstimateDisplayElements[];
        public constructor( private _wwa: wwa_main.WWA, private _imgFileName: string, private _parent: HTMLElement) {
            var ede: EstimateDisplayElements;
            this._element = document.createElement("div");
            this._element.setAttribute( "id", "wwa-battle-estimate");
            this._element.style.display = "none";
            this._edes = [];

            for (var i = 0; i < wwa_data.WWAConsts.BATTLE_ESTIMATE_MONSTER_TYPE_MAX; i++) {
                ede = new EstimateDisplayElements(i, this._imgFileName, this._element);
                this._edes.push(ede);
                this._element.appendChild( ede.elem );
            }
            this._element.addEventListener("click", () => {
                this._wwa.hideBattleEstimateWindow();
            });
            this._parent.appendChild(this._element);
        }

        public update( playerStatus: wwa_data.Status, monsters: number[]): void {
            // モンスターの種類が8種類を超える場合は、先頭の8種類のみ処理
            for (var i = 0; i < wwa_data.WWAConsts.BATTLE_ESTIMATE_MONSTER_TYPE_MAX; i++) {
                if (i >= monsters.length) {
                    // 非表示処理
                    this._edes[i].hide()
                    continue;
                }
                var imgx = this._wwa.getObjectAttributeById(monsters[i], wwa_data.WWAConsts.ATR_X);
                var imgy = this._wwa.getObjectAttributeById(monsters[i], wwa_data.WWAConsts.ATR_Y);
                var imgPos = new wwa_data.Coord(imgx, imgy);
                var eng = this._wwa.getObjectAttributeById(monsters[i], wwa_data.WWAConsts.ATR_ENERGY);
                var str = this._wwa.getObjectAttributeById(monsters[i], wwa_data.WWAConsts.ATR_STRENGTH);
                var def = this._wwa.getObjectAttributeById(monsters[i], wwa_data.WWAConsts.ATR_DEFENCE);
                var enemyStatus = new wwa_data.Status(eng, str, def, 0);
                var result = calc( playerStatus, enemyStatus);
                this._edes[i].setResult( imgPos, enemyStatus, result);

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

    class EstimateResult {
        constructor(
            public isNoEffect: boolean,
            public isOverMaxTurn: boolean,
            public damage: number
        ){ }
    }

    function calc(  playerStatus: wwa_data.Status, enemyStatus: wwa_data.Status  ): EstimateResult {
        var energyE = enemyStatus.energy;

        var attackP = playerStatus.strength - enemyStatus.defence;
        var attackE = Math.max(0, enemyStatus.strength - playerStatus.defence);
        var turn = 0;
        var damage = 0;

        if (attackP > 0) {
            while (1) {
                turn++;
                energyE -= attackP;
                if (energyE <= 0) {
                    return new EstimateResult(false, false, damage);
                }
                damage += attackE;
                if (turn > 10000) {
                    return new EstimateResult(false, true, 0);
                }
            }
        } else {
            return new EstimateResult(true, false, 0);
        }

    }

}