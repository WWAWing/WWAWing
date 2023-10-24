export interface PictureProperties<N = number> {
  pos?: [N, N];
  time?: N,
  size?: [N, N];
  repeat?: [N, N];
  img?: ([N, N] | [N, N, N, N]);
  crop?: [N, N];
  text?: string;
  font?: string;
  color?: [N, N, N];
  // CanvasTextAlign そのままの値
  textAlign?: "center" | "end" | "left" | "right" | "start";
  opacity?: N;
}
