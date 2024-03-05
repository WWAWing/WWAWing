export interface PictureProperties<N = number> {
  pos?: [N, N];
  time?: N,
  size?: [N, N];
  repeat?: [N, N];
  img?: ([N, N] | [N, N, N, N]);
  imgFile?: string;
  // スネークケースになっているだけで、内容は上記と同じ
  img_file?: string;
  sound?: N;
  crop?: [N, N];
  text?: string;
  font?: string;
  fontSize?: number;
  font_size?: number;
  fontFamily?: string;
  font_family?: string;
  italic?: number;
  bold?: number;
  color?: [N, N, N];
  // CanvasTextAlign そのままの値
  textAlign?: "center" | "end" | "left" | "right" | "start";
  text_align?: "center" | "end" | "left" | "right" | "start";
  lineHeight?: N;
  line_height?: N;
  opacity?: N;
  next?: [N] | [N, N] | [N, N, N],
  // TODO map プロパティの座標で PX と PY を指定するとピクチャ作成時の座標が評価されてしまい、移動後はプレイヤーの位置通りにパーツが配置されない。
  //      消去後に評価する特殊な表記方法を設けるか考えているが・・・。
  map?: [N, N, N] | [N, N, N, N],
  // 今後ユーザー定義関数で引数に対応した場合、現状の仕様では引数の指定ができなくなる。引数付きでも受け付けられるように仕様を考える。
  script?: string;
}
