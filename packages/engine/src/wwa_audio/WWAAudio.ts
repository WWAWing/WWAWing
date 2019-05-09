/**
 * WWAの音声ファイルの管理を行うインターフェイスです。
 */
export default interface WWAAudio {
  /**
   * 音声を再生します。
   * 一時停止した場合でも、最初から再生します。
   */
  play(): void;
  /**
   * 音声を止めます。
   * 主にBGMを99番指定で止める場合に利用します。
   */
  pause(): void;
  /**
   * BGMがどうかを確認します。
   * @see SystemSound.BGM_LB
   */
  isBgm(): boolean;
  /**
   * データが取得できたかを確認します。
   * - hasData も isError も false だった場合 -> まだ読み込み中です。
   * - hasData は false だけど isError が true だった場合 -> 読込に失敗しています。
   * - hasData は true だけど isError が false だった場合 -> 正常に読み込まれています。
   */
  hasData(): boolean;
  /**
   * データの取得に失敗したか確認します。
   * hasData メソッドと組み合わせることが多いです。詳細は hasData メソッドのコメントをご確認ください。
   * @see WWAAudio.hasData
   */
  isError(): boolean;
};
