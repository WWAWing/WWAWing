/**
 * WWAの入力状態を一括して管理できるマネージャークラスです。
 */
export default class WWAInputManager {
    /**
     * WWAInputStore を追加します。
     * @todo 引数に WWAInputStore を追加する
     */
    public addStore() {

    }

    /**
     * 現在の入力状態を確認し、押されているかを出力します。
     * @todo 引数に WWAInputType を追加する (もしかしたら文字列？)
     */
    public checkHit(): boolean {
        return false;
    }

    /**
     * 現在の入力状態を確認します。
     * @todo WWAInputStore によって出力されるStateが異なる場合があるので調べておく。
     */
    public getState() {

    }

    /**
     * 手持ちの WWAInputStore すべてに update の操作を行います。
     * @todo 実装する
     */
    public update() {

    }
}
