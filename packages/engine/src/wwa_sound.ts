import { SystemSound } from './wwa_data';

export class Sound {
    private audioBuffer: AudioBuffer;
    private bufferSources: AudioBufferSourceNode[];
    private isLoaded: boolean;
    private isExceededMaxRetryCount?: true;
    private pos: number;

    public constructor(
        /**
         * 音声ファイルのIDです
         */
        private idx: number,
        file: string,
        private audioContext: AudioContext,
        private audioGain: GainNode
    ) {
        this.audioContext = audioContext;
        this.audioGain = audioGain;
        this.audioBuffer = null;
        this.bufferSources = [];

        this.isLoaded = false;
        this.pos = 0;
        // floating promise だが仕方ない
        this._load(idx, file)
    }

    private async fetch(idx: number, file: string): Promise<Response | undefined> {
        try {
            return await fetch(file);
        } catch(error) {
            console.warn(`サウンド ${idx} 番の音声ファイルの取得失敗 (fetch)`);
            return undefined;
        }
    }

    private async getArrayBuffer(idx: number, response: Response): Promise<ArrayBuffer | undefined> {
        try {
            return await response.arrayBuffer();
        } catch(error) {
            console.warn(`サウンド ${idx} 番の音声ファイルの取得失敗 (arrayBuffer)`);
            return undefined;
        }
    }

    private async _load(idx: number, file: string, errorCount: number = 0): Promise<void> {
        if (errorCount >= 10) {
            console.log(`サウンド ${file} 番の音声ファイルの取得失敗 (最大リトライ回数超過)`);
            this.isExceededMaxRetryCount = true;
            return;
        }
        const response = await this.fetch(idx, file);
        if (!response) {
            this._retry(idx, file, errorCount);
            return;
        }
        if (response.status !== 0 && response.status !== 200) {
            console.warn(`サウンド ${idx} 番の音声ファイルが見つかりません！ HTTPエラー番号: ${response.status}`);
            this._cancelLoad();
            return;
        }
        const buffer = await this.getArrayBuffer(idx, response);
         if (!buffer) {
            this._retry(idx, file, errorCount);
            return;
        }
        this.audioContext.decodeAudioData(buffer, buffer => {
            if (buffer.length === 0) {
                console.log(`サウンド ${idx} 番の音声ファイルのバッファサイズが 0 です `);
                this._retry(idx, file, errorCount);
                return;
            }
            this._setData(buffer);
        });
    }

    private _retry(idx: number, file: string, errorCount: number) {
        setTimeout(async () => { await this._load(idx, file, errorCount + 1); }, 100)
    }

    private _setData(data: AudioBuffer): void {
        this.audioBuffer = data;
        this.isLoaded = true;
    }

    private _cancelLoad(): void {
        this.audioBuffer = null;
        this.isLoaded = true;
    }

    /**
     * 音声を再生します。
     * 一時停止した場合でも、最初から再生します。
     */
    public play(): void {
        this.pos = 0;

        let bufferSource: AudioBufferSourceNode = this.audioContext.createBufferSource();
        this.bufferSources.push(bufferSource);

        bufferSource.buffer = this.audioBuffer;
        if (this.isBgm()) {
            bufferSource.loop = true;
        }
        bufferSource.connect(this.audioGain);

        // TODO(rmn): bufferSource.buffer.duration ? あとで調べる
        let duration = (bufferSource as any).duration;
        if ((!isFinite(duration)) || (duration < 0) || (typeof duration !== "number")) {
            duration = 0;
        }

        bufferSource.start(0, this.pos * duration);
        bufferSource.onended = () => {
            const id: number = this.bufferSources.indexOf(bufferSource);
            if (id !== -1) {
                this.bufferSources.splice(id, 1);
            }
            try {
                bufferSource.stop();
                //メモリ解放
                bufferSource.disconnect(this.audioGain);

                bufferSource.buffer = null;//Chromeのメモリ解放　EDGEではエラーでる場合あり
            } catch (e) {
                
            }
            bufferSource.onended = null;
        }

        this.audioGain.connect(this.audioContext.destination);
    }

    /**
     * 音声を止めます。
     * 主にBGMを99番指定で止める場合に利用します。
     */
    public pause(): void {
        this.bufferSources.forEach(bufferSource => {
            try {
                bufferSource.stop();
                //メモリ解放
                bufferSource.disconnect(this.audioGain);

                bufferSource.buffer = null;//Chromeのメモリ解放　EDGEではエラーでる場合あり
            } catch (e) {

            }
            bufferSource.onended = null;
        });
        this.bufferSources.length = 0;
    }
    
    /**
     * BGMがどうかを確認します。
     * @see SystemSound.BGM_LB
     */
    public isBgm(): boolean {
        return this.idx >= SystemSound.BGM_LB;
    }
    /**
     * データが取得できたかを確認します。
     * - hasData も isError も false だった場合 -> まだ読み込み中です。
     * - hasData は false だけど isError が true だった場合 -> 読込に失敗しています。
     * - hasData は true だけど isError が false だった場合 -> 正常に読み込まれています。
     * TODO: isErrorと統合して 名前を getLoadingStatus にして 出力値を "LOADING" | "DONE" | "ERROR" にする
     */
    public hasData(): boolean {
        return this.audioBuffer !== null;
    }
    
    public isLoading(): boolean {
        return !this.isLoaded;
    }

    /**
     * データの取得に失敗したか確認します。
     * hasData メソッドと組み合わせることが多いです。詳細は hasData メソッドのコメントをご確認ください。
     */
    public isError(): boolean {
        return this.isExceededMaxRetryCount || this.isLoaded && this.audioBuffer === null;
    }
}
