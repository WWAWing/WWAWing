import { SystemSound } from './wwa_data';

/**
 * WWAの音声ファイルの管理を行うインターフェイスです。
 */
export interface WWAAudio {
    play(): void;
    pause(): void;
    isBgm(): boolean;
    hasData(): boolean;
    isError(): boolean;
};

export class WWAAudioJS implements WWAAudio {
    private idx: number;
    private element: HTMLAudioElement;

    constructor(idx: number, file: string, parentNode: Node) {
        this.idx = idx;
        this.element = new Audio(file);
        this.element.preload = "auto";
        this.element.loop = this.isBgm();
        this.element.addEventListener("error", function() {
            console.warn(`サウンド ${idx} 番の音声ファイルが見つかりません！`);
        });

        parentNode.appendChild(this.element);
    }

    public play(): void {
        this.element.currentTime = 0;
        this.element.play();
    }
    public pause(): void {
        this.element.pause();
    }
    public isBgm(): boolean {
        return this.idx >= SystemSound.BGM_LB;
    }
    public hasData(): boolean {
        return this.element.readyState >= 2;
    }
    public isError(): boolean {
        return this.element.error !== null;
    }
}

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
                    that.setData(buffer);
                });
            } else {
                console.warn(`サウンド ${idx} 番の音声ファイルが見つかりません！ HTTPエラー番号: ${statusCode}`);
                that.markAsNotFound();
                return;
            }
        });
        req.open('GET', file, true);
        req.send('');
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

    /**
     * 音声データをセットします。
     */
    public setData(data: AudioBuffer): void {
        this.data = data;
        this.isLoaded = true;
    }

    /**
     * 読込を撤回します。
     */
    public markAsNotFound(): void {
        this.isLoaded = true;
    }
}
