export interface UserScriptResponse {
  kind: string,
  data?: string,
  errorMessage?: string
}

export const fetchScriptFile = async (fileName: string): Promise<UserScriptResponse> => {
  try {
    const fileResponse = await fetch(fileName);
    if(fileResponse.status === 200 || fileResponse.status === 304) {
      const responseDataString = await new Response(fileResponse.body).text();
      return <UserScriptResponse> {
        kind: "data",
        data: responseDataString
      }
    }
    else {
      return <UserScriptResponse> {
        kind: "httpError",
        errorMessage: `ファイル ${fileName} が読み込めませんでした。ステータスコード: ${fileResponse.status}`
      }
    }
  }
  catch(e) {
    return <UserScriptResponse> {
      kind: "otherError",
      errorMessage: e.message
    }
  }
}