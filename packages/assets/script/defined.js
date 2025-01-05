/** セーブするごとに呼ばれる関数 */
function CALL_SAVE() {
  MSG("セーブしました")
}

/** 1フレームごとに呼ばれる関数 */
function CALL_FRAME() {
}

/** Rボタンを押した際に呼ばれる関数 */
function CALL_PUSH_R() {
  MSG("R keyが押されました")
}

/** Fボタンを押した際に呼ばれる関数 */
function CALL_PUSH_F() {
  MSG("F keyが押されました")
}

/** Vボタンを押した際に呼ばれる関数 */
function CALL_PUSH_V() {
  MSG("V keyが押されました")
}

/** Tボタンを押した際に呼ばれる関数 */
function CALL_PUSH_T() {
  MSG("T keyが押されました")
}

/** Gボタンを押した際に呼ばれる関数 */
function CALL_PUSH_G() {
  MSG("G keyが押されました")
}

/** Bボタンを押した際に呼ばれる関数 */
function CALL_PUSH_B() {
  MSG("B keyが押されました")
}

/** Enterボタンを押した際に呼ばれる関数 */
function CALL_PUSH_ENTER() {
  MSG("Enter keyが押されました")
}

/** Escボタンを押した際に呼ばれる関数 */
function CALL_PUSH_ESC() {
  MSG("ESC keyが押されました")
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
 * カメラ画面が動く度に呼ばれる関数
 * CX と CY でカメラ画面の左上の座標が取得できます
 */
function CALL_CAMERAMOVE() {
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

/**
 * プレイヤーから敵に与えるダメージ計算式
 */
function CALC_PLAYER_TO_ENEMY_DAMAGE() {
  // 試験的にHPが10000以上なら先頭を即座に打ち切る
  if (HP > 10000) {
    ABORT_BATTLE();
  }
  if (AT >= ENEMY_DF) {
    return AT - ENEMY_DF;
  } else {
    return 0;
  }
}

/**
 * 敵からプレイヤーに与えるダメージ計算式
 */
function CALC_ENEMY_TO_PLAYER_DAMAGE() {
  if (ENEMY_AT >= DF) {
    return ENEMY_AT - DF;
  } else {
    return 0;
  }
}
