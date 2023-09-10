export interface PictureProperties {
  pos?: [number, number];
  time?: number,
  size?: [number, number];
  repat?: [number, number];
  img?: ([number, number] | [number, number, number, number]);
  crop?: [number, number];
  text?: string;
  // 文字サイズに固定化する予定？
  font?: string;
  color?: string;
  // CanvasTextAlign そのままの値
  textAlign?: "center" | "end" | "left" | "right" | "start";
}

/**
 * ピクチャで使用可能なプロパティ名
 * 下記配列にない場合は不正利用と扱いエラーで弾く
 */
export const PicturePropertyNames: (keyof PictureProperties)[] = [
  "pos",
  "time",
  "size",
  "repat",
  "img",
  "crop",
  "text",
  "font",
  "color",
  "textAlign",
];
