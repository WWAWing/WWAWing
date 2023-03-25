import { SystemSound } from './wwa_data';

export class Sound {
    private audioBuffer: AudioBuffer;
    private bufferSources: AudioBufferSourceNode[];
    private isLoaded: boolean;
    private isExceededMaxRetryCount?: true;

    public constructor(
        /**
         * サウンド番号
         */
        private id: number,
        private fileName: string,
        private audioContext: AudioContext,
        private audioGain: GainNode
    ) {
        this.audioContext = audioContext;
        this.audioGain = audioGain;
        this.audioBuffer = null;
        this.bufferSources = [];

        this.isLoaded = false;
        // floating promise だが仕方ない
        this.load()
    }

    private async fetchSoundFile(): Promise<Response | undefined> {
        try {
            return await fetch(this.fileName);
        } catch(error) {
            console.warn(`サウンド ${this.id} 番の音声ファイルの取得失敗 (fetch)`);
            return undefined;
        }
    }

    private async getArrayBuffer(response: Response): Promise<ArrayBuffer | undefined> {
        try {
            return await response.arrayBuffer();
        } catch(error) {
            console.warn(`サウンド ${this.id} 番の音声ファイルの取得失敗 (arrayBuffer)`);
            return undefined;
        }
    }

    private async load(errorCount: number = 0): Promise<void> {
        if (errorCount >= 10) {
            console.log(`サウンド ${this.id} 番の音声ファイルの取得失敗 (最大リトライ回数超過)`);
            this.isExceededMaxRetryCount = true;
            return;
        }
        const response = await this.fetchSoundFile();
        if (!response) {
            this.retry(errorCount);
            return;
        }
        if (response.status !== 0 && response.status !== 200) {
            console.warn(`サウンド ${this.id} 番の音声ファイルが見つかりません！ HTTPエラー番号: ${response.status}`);
            this.cancelLoad();
            return;
        }
        const buffer = await this.getArrayBuffer(response);
         if (!buffer) {
            this.retry(errorCount);
            return;
        }
        this.audioContext.decodeAudioData(buffer, buffer => {
            if (buffer.length === 0) {
                console.log(`サウンド ${this.id} 番の音声ファイルのバッファサイズが 0 です `);
                this.retry(errorCount);
                return;
            }
            this.setData(buffer);
        });
    }

    private retry(errorCount: number) {
        setTimeout(async () => { await this.load(errorCount + 1); }, 100)
    }

    private setData(data: AudioBuffer): void {
        this.audioBuffer = data;
        this.isLoaded = true;
    }

    private cancelLoad(): void {
        this.audioBuffer = null;
        this.isLoaded = true;
    }

    /**
     * 音声を再生します。
     * 一時停止した場合でも、最初から再生します。
     * @param delay 遅延時間
     */
    public play(delay = 0): void {
        const bufferSource: AudioBufferSourceNode = this.audioContext.createBufferSource();
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

        bufferSource.onended = () => {
            const id = this.bufferSources.indexOf(bufferSource);
            if (id !== -1) {
                this.bufferSources.splice(id, 1);
            }
            this.disposeBufferSource(bufferSource);
        }
        setTimeout(() => {
            bufferSource.start();
        }, delay);

        this.audioGain.connect(this.audioContext.destination);
    }

    /**
     * 音声を止めます。
     * 主にBGMを99番指定で止める場合に利用します。
     */
    public pause(): void {
        this.bufferSources.forEach(this.disposeBufferSource)
        this.bufferSources.length = 0;
    }
    
    /**
     * BGMがどうかを確認します。
     * @see SystemSound.BGM_LB
     */
    public isBgm(): boolean {
        return this.id >= SystemSound.BGM_LB;
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

    private disposeBufferSource = (bufferSource: AudioBufferSourceNode): void => {
        try {
            bufferSource.stop();
            // メモリ解放
            bufferSource.disconnect(this.audioGain);

            bufferSource.buffer = null; // Chromeのメモリ解放
        } catch (e) {}
        bufferSource.onended = null;
    }
}
