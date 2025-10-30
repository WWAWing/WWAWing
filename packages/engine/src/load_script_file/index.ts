export interface UserScriptResponse {
  fileName: string;
  kind: string,
  data?: string,
  errorMessage?: string
}

export const fetchScriptFile = async (fileName: string): Promise<UserScriptResponse> => {
  try {
    const fileResponse = await fetch(fileName);
    if(fileResponse.status === 200 || fileResponse.status === 304) {
      const responseDataString = await new Response(fileResponse.body).text();
      return  {
        kind: "data",
        data: responseDataString,
        fileName
      }
    }
    else {
      return  {
        kind: "httpError",
        errorMessage: `ファイル ${fileName} が読み込めませんでした。ステータスコード: ${fileResponse.status}`,
        fileName
      }
    }
  }
  catch(error) {
    return {
      kind: "otherError",
      errorMessage: error.message,
      fileName
    }
  }
}
