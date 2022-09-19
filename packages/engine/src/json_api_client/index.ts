export type JsonResponseErrorKind = "brokenJson" | "httpError" | "connectionError";

export type JsonResponseKind = JsonResponseErrorKind | "data";

export type JsonResponseError<ErrorKind = JsonResponseErrorKind> = {
    kind: ErrorKind;
    errorMessage: string;
};

export type JsonResponseData = {
    kind: "data";
    data: unknown;
}

export type JsonResponse<ResponseKind = JsonResponseKind> = JsonResponseError<Exclude<ResponseKind, "data">> | JsonResponseData;

export const fetchJsonFile = async (fileName: string): Promise<JsonResponse> => fetch(fileName).then(response =>
    (response.status === 200 || response.status === 304 ? {
        kind: "data" as const,
        data: response
    } : {
        kind: "httpError" as const,
        errorMessage: `ファイル ${fileName} が読み込めませんでした。ステータスコード: ${response.status}`
    })).catch(_error => ({
        kind: "connectionError" as const,
        errorMessage: `ファイル ${fileName} が読み込めませんでした。通信状態がいい場所で再度お試しください。`
    })).then(async (result) => (
        result.kind === "data" ? {
        kind: "data" as const,
        data: await result.data.json()
    } : result
    )).catch(_error => ({
        kind: "brokenJson" as const,
        errorMessage: `ファイル ${fileName} が壊れています。`
    }));
