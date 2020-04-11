export const new2DArray = (size1: number, size2: number): number[][] => {
  const arr: number[][] = new Array(size1);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = new Array(size2);
  }
  return arr;
};

export const signedByte = (b: number): number => {
  b = b % 0x100;
  return b >= 0x80 ? b - 0x100 : b;
};
