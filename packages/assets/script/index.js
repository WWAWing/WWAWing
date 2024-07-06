function moveRand() {
  AT=RAND(1000);
  JUMPGATE(RAND(100), RAND(100));
}

function makeRandomParts() {
  for(i = 0; i < 5; i=i+1) {
    for(j = 0; j < 5; j=j+1) {
      o[PX-5+(i*2)][PY-5+(j*2)] = RAND(100);
    }
  }
}

function makeRandomPartsAllMaps() {
  for(i = 0; i < 100; i=i+1) {
    for(j = 0; j < 100; j=j+1) {
      if(RAND(3) > 1) {
        o[i][j] = RAND(200);
      }
      if(RAND(3) > 1) {
        m[i+1][j+1] = RAND(100);
      }
    }
  }
  MSG("配置完了");
}

function checkTriggerParts() {
  MSG(`（ユーザー定義関数）\nこのパーツの座標は X:${X} Y:${Y} です。\nパーツ番号は ${ID} で、種類は ${TYPE} です。`);
}

function afterDeletePicture() {
  MSG("ユーザー定義関数を実行しました。");
}

function timeOutRunning() {
  // CALL_JUMPGATE が定義されていると、 MSG 関数によるメッセージ表示が働かないため、
  // ユーザー定義関数においては移動だけにしておいて、メッセージ表示やお片付けは移動先に配置するパーツで何とかする
  o[12][14] = 113;
  JUMPGATE(12, 14);
}

function CALL_SAVE() {
  MSG("セーブしました！")
}

function CALL_FRAME() {
  v[0]=TIME;
}
