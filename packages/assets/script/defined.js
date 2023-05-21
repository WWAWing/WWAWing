/** セーブするごとに呼ばれる関数 */
function CALL_SAVE() {
  MSG("セーブしました")
}

/** 1フレームごとに呼ばれる関数 */
function CALL_FRAME() {
}

/** Cボタンを押した際に呼ばれる関数 */
function CALL_PUSH_C() {
  MSG("C keyが押されました")
}

/** WWAを開始した際に呼ばれる関数 */
function CALL_WWA_START() {
  MSG("ゲームを開始します")
}

/** クイックロード時に呼ばれる関数 */
function CALL_QUICKLOAD() {
  MSG("クイックロードされました")
}

/** リスタート時に呼ばれる関数 */
function CALL_RESTART() {
  MSG("リスタートされました")
}

/** パスワードロード時に呼ばれる関数 */
function CALL_PASSWORDLOAD() {
  MSG("パスワードロードされました")
}

/** ゲームオーバー時に呼ばれる関数 */
function CALL_GAMEOVER() {
  MSG("ゲームオーバーになりました")
}

/**
 * バトルレポートを見た時に呼ばれる関数
 * この関数内で MSG を呼ぶとウィンドウが二重で表示されるので注意してください
 **/
function CALL_BATTLE_REPORT() {
  MSG("Battle Reportを見ました")
}

/**
 * プレイヤーが動く度に呼ばれる関数
 */
function CALL_MOVE() {
}

/**
 * 速度変更時に呼ばれる関数
 */
function CALL_CHANGE_SPEED() {
  MSG("速度変更をしました")
}

/**
 * ジャンプゲートで移動した際に呼ばれる関数
 */
function CALL_JUMPGATE() {
  MSG("jumpgate移動しました")
}