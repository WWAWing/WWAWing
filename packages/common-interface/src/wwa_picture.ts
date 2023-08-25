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
