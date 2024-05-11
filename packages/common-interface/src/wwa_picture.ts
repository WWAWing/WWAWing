export interface PictureProperties<N = number> {
  pos?: [N, N];
  time?: N | [N] | [N, N];
  timeFrame?: N | [N] | [N, N];
  size?: [N, N];
  animTime?: [N, N];
  animTimeFrame?: [N, N];
  move?: [N, N];
  accel?: [N, N];
  zoom?: [N, N];
  zoomAccel?: [N, N];
  // テンキーの並びと一致する。 0 は左上 (7 と同じ扱い)。
  anchor?: N;
  circle?: [N] | [N, N] | [N, N, N] | [N, N, N, N];
  repeat?: [N, N];
  img?: ([N, N] | [N, N, N, N]);
  imgFile?: string;
  sound?: N;
  crop?: [N, N];
  text?: string;
  font?: string;
  fontSize?: number;
  fontFamily?: string;
  italic?: number;
  bold?: number;
  color?: [N, N, N];
  // CanvasTextAlign そのままの値
  textAlign?: "center" | "end" | "left" | "right" | "start";
  lineHeight?: N;
  opacity?: N;
  fade?: N;
  angle?: N;
  rotate?: N;
  wait?: N;
  waitFrame?: N;
  next?: [N] | [N, N] | [N, N, N],
  create?: ([N] | [N, N] | [N, N, N] | [N, N, N, N])[],
  // TODO map プロパティの座標で PX と PY を指定するとピクチャ作成時の座標が評価されてしまい、移動後はプレイヤーの位置通りにパーツが配置されない。
  //      消去後に評価する特殊な表記方法を設けるか考えているが・・・。
  map?: [N, N, N] | [N, N, N, N],
  // 今後ユーザー定義関数で引数に対応した場合、現状の仕様では引数の指定ができなくなる。引数付きでも受け付けられるように仕様を考える。
  script?: string;
}
