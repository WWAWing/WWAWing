import { WWAInputStore, WWAInputState, WWAInputType, WWAInputStoreType } from "@wwawing/common-interface";
import { WWAConsts } from "../wwa_data";

/**
 * 複数用意した WWAInputState を1つの WWAInputState にまとめます。
 *     PRESS→DOWN/UP→NONE の優先順位で確認します。
 *     DOWN と UP が複数確認された場合は PRESS とみなされます。
 *     例えばキーボードの指定したキーが UP で、ゲームパッドの指定したボタンが DOWN とした場合は、 PRESS が出てきます。
 * @param states 
 */
function unionState(states: WWAInputState[]): WWAInputState {
    if (states.includes(WWAInputState.PRESS) ||
    (states.includes(WWAInputState.DOWN) && states.includes(WWAInputState.UP))
    ) {
        return WWAInputState.PRESS;
    } else if (states.includes(WWAInputState.DOWN)) {
        return WWAInputState.DOWN;
    } else if (states.includes(WWAInputState.UP)) {
        return WWAInputState.DOWN;
    }
    return WWAInputState.NONE;
}

/**
 * WWAの入力状態を一括して管理できるマネージャークラスです。
 * @todo プレイヤーが操作可能かどうかを判定できるようにしたい
 */
export default class WWAInputManager {
    /**
     * WWAInputStore の配列です。
     *     コントローラーの種類を確認するため、インスタンスの配列ではなく、インスタンスと種類をまとめたオブジェクトの配列になります。
     * @property
     */
    private _inputStores: Array<InputStoreObject>;

    constructor() {
        this._inputStores = [];
    }

    /**
     * WWAInputStore を追加します。
     * @param inputStore WWAInputStore のインスタンス
     * @param inputStoreType そのインスタンスの種類
     * @param callbackFn 追加後に実行したいコールバック関数
     */
    public addStore(inputStore: WWAInputStore, inputStoreType: WWAInputStoreType, callbackFn?: (store: WWAInputStore) => void) {
        this._inputStores.push({
            store: inputStore,
            type: inputStoreType
        });
        if (callbackFn) {
            callbackFn(inputStore);
        }
    }

    /**
     * 現在の入力状態を確認し、押されているかを出力します。
     * @param inputType 確認したいボタンの種類
     * @param inputStores inputStore のフィルタリング(空欄の場合はすべての inputStore を確認)
     * @example manager.checkHit(WWAInputType.UP)
     * @example manager.checkHit(WWAInputType.ITEM_1, [WWAInputStoreType.MOUSE])
     */
    public checkHit(inputType: WWAInputType, inputStores: Array<WWAInputStoreType> = []): boolean {
        if (inputStores.length <= 0) {
            return this._inputStores.some(storeObject =>
                unionState(storeObject.store.checkButtonState(inputType)) === WWAInputState.PRESS
            );
        }

        return this._getInputStoresByTypes(inputStores).some(inputStore => 
            unionState(inputStore.checkButtonState(inputType)) === WWAInputState.PRESS
        );
    }

    /**
     * checkHit の DOWN 検知版です。押しっぱなしでは反応しません。
     * @param inputType 
     * @param inputStores 
     */
    public checkTrigger(inputType: WWAInputType, inputStores: Array<WWAInputStoreType> = []): boolean {
        const isInputStateDown = (inputStore: WWAInputStore) => {
            return inputStore.checkButtonState(inputType).some(inputState =>
                inputState === WWAInputState.DOWN
            );
        }

        if (inputStores.length <= 0) {
            return this._inputStores.some(storeObject =>
                isInputStateDown(storeObject.store)
            );
        }

        return this._getInputStoresByTypes(inputStores).some(isInputStateDown);
    }

    /**
     * 現在の入力状態を確認します。
     * @todo PRESS_MESSAGECHANGE も考慮するようにする
     */
    public getState(inputType: WWAInputType) {
        const inputStates: WWAInputState[] = [].concat(...this._inputStores.map(storeObject => storeObject.store.checkButtonState(inputType)));
        return unionState(inputStates);
    }

    /**
     * 現在入力している状態でメッセージ送りが可能か判別します。
     *     条件は 指定した操作に対応したボタンが DOWN または 押してから 20フレーム秒以上 になります。
     */
    public canMessageChange(inputType: WWAInputType): boolean {
        return this._inputStores.some(storeObject => {
            const store = storeObject.store;
            if (unionState(store.checkButtonState(inputType)) === WWAInputState.DOWN) {
                return true;
            }

            const frameNum = store.getInputContinueFrameNum(inputType);
            return frameNum !== null && frameNum >= WWAConsts.KEYPRESS_MESSAGE_CHANGE_FRAME_NUM;
        });
    }

    /**
     * 手持ちの WWAInputStore すべてに update の操作を行います。
     */
    public update() {
        this._eachInputStores(store => store.update());
    }

    /**
     * すべての WWAInputStore の入力状態をクリアします。
     */
    public allClear() {
        this._eachInputStores(store => store.clear());
    }

    public memorizeKeyStateOnControllableFrame() {
        
    }

    /**
     * 指定した InputStore の種類から InputStore のインスタンスを取得し、そのインスタンスを利用してコールバック関数を実行させます。
     * @param inputStoreType 
     * @param callbackFn 
     */
    public getInputStore(inputStoreType: WWAInputStoreType, callbackFn: (store: WWAInputStore) => void) {
        const targetStore = this._getInputStoreByType(inputStoreType);
        if (targetStore !== null) {
            callbackFn(targetStore);
        }
    }

    /**
     * 手持ちの InputStore それぞれに指定した処理を実行させます。
     * @param callbackFn それぞれの InputStore に実行される関数
     */
    private _eachInputStores(callbackFn: (store: WWAInputStore, storeType: WWAInputStoreType) => void) {
        this._inputStores.forEach(storeObject => {
            callbackFn(storeObject.store, storeObject.type);
        });
    }

    /**
     * 指定した InputStore の種類から InputStore のインスタンスを返します。
     * @returns {WWAInputStore|null} 対応した InputStore のインスタンス (見つからなかった場合は null)
     */
    private _getInputStoreByType(inputStoreType: WWAInputStoreType): WWAInputStore|null {
        const targetStoreObjects = this._inputStores.filter((storeObject) => {
            return storeObject.type === inputStoreType;
        });
        if (targetStoreObjects.length <= 0) {
            return null;
        }
        return targetStoreObjects[1].store;
    }

    /**
     * _getInputStoreByType の複数対応版です。
     *     inputStores 内に対応した InputStore のインスタンスが無い場合は無視します。
     * @param inputStores 
     * @return {Array<WWAInputStore>}
     * @see WWAInputManager._getInputStoreByType
     */
    private _getInputStoresByTypes(inputStores: Array<WWAInputStoreType>): Array<WWAInputStore> {
        let resultInputStores: Array<WWAInputStore> = [];

        inputStores.map((inputStoreType) => {
            const targetInputStore = this._getInputStoreByType(inputStoreType);
            if (targetInputStore !== null) {
                resultInputStores.push(targetInputStore);
            }
        });

        return resultInputStores;
    }

}

type InputStoreObject = {
    store: WWAInputStore,
    type: WWAInputStoreType
}
