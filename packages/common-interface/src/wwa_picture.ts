export interface PictureProperties<N = number> {
  pos?: [N, N];
  time?: N,
  size?: [N, N];
  repeat?: [N, N];
  img?: ([N, N] | [N, N, N, N]);
  imgFile?: string;
  crop?: [N, N];
  text?: string;
  font?: string;
  color?: [N, N, N];
  // CanvasTextAlign そのままの値
  textAlign?: "center" | "end" | "left" | "right" | "start";
  opacity?: N;
  next?: [N] | [N, N],
  // TODO map プロパティの座標で PX と PY を指定するとピクチャ作成時の座標が評価されてしまい、移動後はプレイヤーの位置通りにパーツが配置されない。
  //      消去後に評価する特殊な表記方法を設けるか考えているが・・・。
  map?: [N, N, N] | [N, N, N, N],
}
