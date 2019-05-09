import { SystemSound } from './wwa_data';

/**
 * WWAの音声ファイルの管理を行うインターフェイスです。
 */
export interface WWAAudio {
    /**
     * 音声を再生します。
     * 一時停止した場合でも、最初から再生します。
     */
    play(): void;
    /**
     * 音声を止めます。
     * 主にBGMを99番指定で止める場合に利用します。
     */
    pause(): void;
    /**
     * BGMがどうかを確認します。
     * @see SystemSound.BGM_LB
     */
    isBgm(): boolean;
    /**
     * データが取得できたかを確認します。
     * - hasData も isError も false だった場合 -> まだ読み込み中です。
     * - hasData は false だけど isError が true だった場合 -> 読込に失敗しています。
     * - hasData は true だけど isError が false だった場合 -> 正常に読み込まれています。
     */
    hasData(): boolean;
    /**
     * データの取得に失敗したか確認します。
     * hasData メソッドと組み合わせることが多いです。詳細は hasData メソッドのコメントをご確認ください。
     * @see WWAAudio.hasData
     */
    isError(): boolean;
};

/**
 * WWAAudioElement は、 audio 要素を内部で配置して、再生の際に再生する方式です。
 * IE といった Web Audio API が利用できない場合はこの WWAAudioElement を利用します。
 */
export class WWAAudioElement implements WWAAudio {
    private idx: number;
    private _mainElement: HTMLAudioElement;
    /**
     * 戦闘など、同じ音を高速に何度も鳴らす時用のサブの要素
     */
    private _subElement: HTMLAudioElement;
    private _currentElement: HTMLAudioElement;
    private _nextIsSub: boolean;

    constructor(idx: number, file: string, parentNode: Node) {
        this.idx = idx;
        this._mainElement = this._createElement(file);
        this._mainElement.addEventListener("error", function() {
            console.warn(`サウンド ${idx} 番の音声ファイルが見つかりません！`);
        });

        this._subElement = !this.isBgm() ? this._createElement(file) : null;
        this._currentElement = this._mainElement;
        this._nextIsSub = true;

        parentNode.appendChild(this._mainElement);
    }

    private _createElement(file: string): HTMLAudioElement {
        let element = new Audio(file);
        element.preload = "auto";
        element.loop = this.isBgm();

        return element;
    }

    public play(): void {
        this._currentElement.currentTime = 0;
        this._currentElement.play();
        if (!this.isBgm()) {
            this._currentElement = this._nextIsSub ? this._subElement : this._mainElement;
            this._nextIsSub = !this._nextIsSub;
        }
    }
    public pause(): void {
        this._currentElement.pause();
    }
    public isBgm(): boolean {
        return this.idx >= SystemSound.BGM_LB;
    }
    public hasData(): boolean {
        return this._mainElement.readyState >= 2;
    }
    public isError(): boolean {
        return this._mainElement.error !== null;
    }
}

/**
 * WWAWebAudio は Web Audio API を利用した方式です。
 * Web Audio API が利用できる環境であれば、原則こちらを利用します。
 * (ただし、スマートフォンのブラウザでは特性上、考慮が必要な箇所があるかもしれません。)
 */
export class WWAWebAudio implements WWAAudio {
    private idx: number;
    private audioContext: AudioContext;
    private audioGain: GainNode;
    private data: AudioBuffer;
    private isLoaded: boolean;
    private bufferSources: AudioBufferSourceNode[];
    private pos: number;

    constructor(idx: number, file: string, audioContext: AudioContext, audioGain: GainNode) {
        this.idx = idx;
        this.audioContext = audioContext;
        this.audioGain = audioGain;
        this.data = null;
        this.isLoaded = false;

        this.bufferSources = [];
        this.pos = 0;
        this._load(idx, file);
    }

    private _load(idx: number, file: string): void {
        const audioContext = this.audioContext;
        const that = this;
        
        let req = new XMLHttpRequest();
        let errorCount = 0;
        req.responseType = 'arraybuffer';

        req.addEventListener("load", function(event) {
            const statusCode = req.status;
            if (statusCode === 0 || statusCode === 200) {
                audioContext.decodeAudioData(req.response, function (buffer) {
                    if (buffer.length === 0) {
                        if (errorCount > 10) {
                            // 10回エラー
                            console.log("error audio file!  " + file + " buffer size " + buffer.length);
                        } else {
                            setTimeout(function () {
                                that._load(idx, file);
                            }, 100);
                            errorCount++;
                            return;
                        }
                    }
                    that._setData(buffer);
                });
            } else {
                console.warn(`サウンド ${idx} 番の音声ファイルが見つかりません！ HTTPエラー番号: ${statusCode}`);
                that._cancelLoad();
                return;
            }
        });
        req.open('GET', file, true);
        req.send('');
    }

    private _setData(data: AudioBuffer): void {
        this.data = data;
        this.isLoaded = true;
    }

    private _cancelLoad(): void {
        this.data = null;
        this.isLoaded = true;
    }

    public play(): void {
        this.pos = 0;

        let audioContext = this.audioContext;
        let bufferSource: AudioBufferSourceNode = null;

        bufferSource = audioContext.createBufferSource();
        this.bufferSources.push(bufferSource);

        bufferSource.buffer = this.data;
        if (this.isBgm()) {
            bufferSource.loop = true;
        }
        bufferSource.connect(this.audioGain);

        // gainNode.gain.setValueAtTime(1, audioContext.currentTime);
        // TODO(rmn): bufferSource.buffer.duration ? あとで調べる
        let duration = (bufferSource as any).duration;
        if ((!isFinite(duration)) || (duration < 0) || (typeof duration !== "number")) {
            duration = 0;
        }
        bufferSource.start(0, this.pos * duration);
        bufferSource.onended = function () {
            var id: number = this.bufferSources.indexOf(bufferSource);
            if (id !== -1) {
                this.bufferSources.splice(id, 1);
            }
            try {
                bufferSource.stop();
            } catch (e) {
                
            }
            bufferSource.onended = null;
        }.bind(this);
        this.audioGain.connect(this.audioContext.destination);
    }

    public pause(): void {
        const len: number = this.bufferSources.length;
        let i: number;
        let bufferSource: AudioBufferSourceNode = null;

        for (i = 0; i < len; i++) {
            bufferSource = this.bufferSources[i];
            try {
                bufferSource.stop();
            } catch (e) {

            }
            bufferSource.onended = null;
        }
        this.bufferSources.length = 0;
    }

    public isBgm(): boolean {
        return this.idx >= SystemSound.BGM_LB;
    }

    public hasData(): boolean {
        return this.data !== null;
    }
    
    public isLoading(): boolean {
        return !this.isLoaded;
    }

    public isError(): boolean {
        return this.isLoaded && this.data === null;
    }
}
