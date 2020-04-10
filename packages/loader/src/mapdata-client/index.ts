export class MapdataClient {
  constructor(private fileName: string) {}
  
  public request(callback: (error?: any, data?: any) => any): void {
    const xhr: XMLHttpRequest = new XMLHttpRequest();
    try {
      // TODO: XHR をやめて、nodeでも動くようにする
      // 例えば、axiosを導入すればどちらでも動くコードにできるはず
      // (Promise を IE11で使えるようにするためにengine側で @babel/preset-env をかける必要があるので注意)
      // (この場合は、ライセンス表記に「axios」「core-js」を増やす必要があることに注意 どちらもMIT)
      xhr.open("GET", this.fileName, true);
      xhr.responseType = "arraybuffer";

      xhr.onreadystatechange = () => {
        try {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200 || xhr.status === 304) {
              callback(undefined, xhr.response)
            } else if (xhr.status === 404) {
              throw new Error(
                "マップデータ「" +
                this.fileName +
                "」が見つかりませんでした。\n" +
                "HTTPステータスコードは " +
                xhr.status +
                "です。"
              );
            } else if (xhr.status === 403) {
              throw new Error(
                "マップデータ「" +
                this.fileName +
                "」を読み取る権限がないようです。\n" +
                "管理者の方へ: マップデータのパーミッションを確認してください。\n" +
                "HTTPステータスコードは " +
                xhr.status +
                "です。"
              );
            } else {
              throw new Error(
                "マップデータ「" +
                this.fileName +
                "」の読み込みに失敗しました。\n" +
                "HTTPステータスコードは " +
                xhr.status +
                "です。"
              );
            }
          }
        } catch (error) {
          callback(error)
        }
      };
      xhr.send(null);
    } catch (e) {
      callback(new Error(
        "ロードエラー: ローカルテストの場合は、ブラウザが対応していない可能性があります。\n" +
        e.message
      ));
    }
  }
}