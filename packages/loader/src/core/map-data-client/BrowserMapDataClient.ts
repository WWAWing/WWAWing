import { BaseMapDataClient } from "./BaseMapDataClient";

/**
 * ブラウザで使うマップデータを取得するクライアント
 */
export class BrowserMapDataClient extends BaseMapDataClient {
  constructor(private uri: string) {
    super();
  }

  private static async fetch(uri: string): Promise<Response> {
    try {
      return await fetch(uri);
    } catch (error) {
      throw new Error(
        `マップデータ 「${uri}」の読み込みに失敗しました。
        通信環境の良いところで再度お試しください。
        ローカルテストの場合は、ブラウザが対応していない可能性があります。`
      );
    }
  }

  private static handleError(uri: string, response: Response): void {
    const statusCodeMessage = `HTTPステータスコードは ${response.status} です。`
    switch (response.status) {
      case 200:
      case 304:
        // OK
        return;
      case 403:
        throw new Error(
          `マップデータ「${uri}」を読み取る権限がないようです。
          管理者の方へ: マップデータのパーミッションを確認してください。
          ${statusCodeMessage}`
        );
      case 404:
        throw new Error(
          `マップデータ「${uri}」が見つかりませんでした。
          ${statusCodeMessage}`
        );
      default:
        throw new Error(
          `マップデータ「${uri}」の読み込みに失敗しました。
          ${statusCodeMessage}`
        );
    }
  }

  public async request(): Promise<ArrayBufferLike> {
    const response = await BrowserMapDataClient.fetch(this.uri);
    BrowserMapDataClient.handleError(this.uri, response);
    const buffer = await response.arrayBuffer();
    return buffer;
  }
}
