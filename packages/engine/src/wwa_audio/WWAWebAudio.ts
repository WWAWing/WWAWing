import WWAAudio from './WWAAudio';

/**
 * WWAWebAudio は Web Audio API を利用した方式です。
 * Web Audio API が利用できる環境であれば、原則こちらを利用します。
 * (ただし、スマートフォンのブラウザでは特性上、考慮が必要な箇所があるかもしれません。)
 */
export default class WWAWebAudio extends WWAAudio {
    private audioContext: AudioContext;
    private audioGain: GainNode;
    private audioBuffer: AudioBuffer;
    private bufferSources: AudioBufferSourceNode[];
    private isLoaded: boolean;
    private pos: number;

    public constructor(idx: number, file: string, audioContext: AudioContext, audioGain: GainNode) {
        super(idx);
        this.audioContext = audioContext;
        this.audioGain = audioGain;
        this.audioBuffer = null;
        this.bufferSources = [];

        this.isLoaded = false;
        this.pos = 0;
        this._load(idx, file);
    }

    private _load(idx: number, file: string): void {
        const audioContext = this.audioContext;
        
        let req = new XMLHttpRequest();
        let errorCount = 0;
        req.responseType = 'arraybuffer';

        req.addEventListener("load", event => {
            const statusCode = req.status;

            if (statusCode !== 0 && statusCode !== 200) {
                console.warn(`サウンド ${idx} 番の音声ファイルが見つかりません！ HTTPエラー番号: ${statusCode}`);
                this._cancelLoad();
                return;
            }
            
            audioContext.decodeAudioData(req.response, buffer => {
                if (buffer.length === 0) {
                    if (errorCount > 10) {
                        console.log(`error audio file!  ${file} buffer size ${buffer.length}`);
                    } else {
                        setTimeout(() => {
                            this._load(idx, file);
                        }, 100);
                        errorCount++;
                        return;
                    }
                }
                this._setData(buffer);
            });

        });
        req.open('GET', file, true);
        req.send('');
    }

    private _setData(data: AudioBuffer): void {
        this.audioBuffer = data;
        this.isLoaded = true;
    }

    private _cancelLoad(): void {
        this.audioBuffer = null;
        this.isLoaded = true;
    }

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
                bufferSource.disconnect(this.audioGain);
            } catch (e) {
                
            }
            bufferSource.onended = null;
        }

        this.audioGain.connect(this.audioContext.destination);
    }

    public pause(): void {
        this.bufferSources.forEach(bufferSource => {
            try {
                bufferSource.stop();
                bufferSource.disconnect(this.audioGain);
            } catch (e) {

            }
            bufferSource.onended = null;
        });
        this.bufferSources.length = 0;
    }

    public hasData(): boolean {
        return this.audioBuffer !== null;
    }
    
    public isLoading(): boolean {
        return !this.isLoaded;
    }

    public isError(): boolean {
        return this.isLoaded && this.audioBuffer === null;
    }
}
