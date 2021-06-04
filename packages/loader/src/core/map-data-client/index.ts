import axios from "axios";

export class MapDataClient {
  constructor(private fileName: string) {}
  
  public request(callback: (error?: any, data?: any) => any): void {
    try {
      // TODO: XHR をやめて、nodeでも動くようにする
      // 例えば、axiosを導入すればどちらでも動くコードにできるはず
      // (Promise を IE11で使えるようにするためにengine側で @babel/preset-env をかける必要があるので注意)
      // (この場合は、ライセンス表記に「axios」「core-js」を増やす必要があることに注意 どちらもMIT)
      axios.get(this.fileName, { responseType: 'arraybuffer' })
        .then(value => {
          if (value.status == 200 || value.status == 304) {
            callback(undefined, value.data);
          } else if (value.status == 404) {
            throw new Error(
              "マップデータ「" +
              this.fileName +
              "」が見つかりませんでした。\n" +
              "HTTPステータスコードは " +
              value.status +
              "です。"
            );
          } else if (value.status == 403) {
            throw new Error(
              "マップデータ「" +
              this.fileName +
              "」を読み取る権限がないようです。\n" +
              "管理者の方へ: マップデータのパーミッションを確認してください。\n" +
              "HTTPステータスコードは " +
              value.status +
              "です。"
            );
          } else {
            throw new Error(
              "マップデータ「" +
              this.fileName +
              "」の読み込みに失敗しました。\n" +
              "HTTPステータスコードは " +
              value.status +
              "です。"
            );
          }
        }).catch(reason => {
          callback(reason);
        });

    } catch (e) {
      callback(new Error(
        "ロードエラー: ローカルテストの場合は、ブラウザが対応していない可能性があります。\n" +
        e.message
      ));
    }
  }
}
