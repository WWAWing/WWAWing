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

function show_sword() {
  v["sword_x"] = 160;
  v["sword_y"] = 160;
  PICTURE(1, {
    pos: [v["sword_x"], v["sword_x"]],
    img: [4, 2],
    size: [120, 120]
  });
  WAIT_ENTER("next_action", "exec_up", "exec_down", "exec_right", "exec_left");
}

function next_action() {
  MSG("画面がクリックされました");
  PICTURE(1);
}

function exec_up() {
  v["sword_y"] -= 10;
  PICTURE(1, {
    pos: [v["sword_x"], v["sword_y"]],
    img: [4, 2],
    size: [120, 120]
  });
}

function exec_down() {
  v["sword_y"] += 10;
  PICTURE(1, {
    pos: [v["sword_x"], v["sword_y"]],
    img: [4, 2],
    size: [120, 120]
  });
}

function exec_right() {
  v["sword_x"] += 10;
  PICTURE(1, {
    pos: [v["sword_x"], v["sword_y"]],
    img: [4, 2],
    size: [120, 120]
  });
}

function exec_left() {
  v["sword_x"] -= 10;
  PICTURE(1, {
    pos: [v["sword_x"], v["sword_y"]],
    img: [4, 2],
    size: [120, 120]
  });
}
