export interface PictureProperties {
  pos?: [number, number];
  time?: number,
  size?: [number, number];
  repeat?: [number, number];
  img?: ([number, number] | [number, number, number, number]);
  crop?: [number, number];
  text?: string;
  font?: string;
  color?: [number, number, number];
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
  "repeat",
  "img",
  "crop",
  "text",
  "font",
  "color",
  "textAlign",
];
