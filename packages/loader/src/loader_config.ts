// webpackにより注入
declare const IS_WEB_WORKER_MODE: boolean;
export interface LoaderConf {
    is_worker: boolean;
};
export const conf = {
    is_worker: IS_WEB_WORKER_MODE
};