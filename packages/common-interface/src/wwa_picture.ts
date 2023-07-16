export interface PictureProperties {
  pos?: [number, number];
  time?: number,
  size?: [number, number];
  repat?: [number, number];
  img?: ([number, number] | [number, number, number, number]);
  crop?: [number, number];
  text?: string;
  font?: string;
  color?: string;
}
