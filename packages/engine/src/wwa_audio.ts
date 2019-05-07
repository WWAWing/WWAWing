import { SystemSound } from './wwa_data';

/**
 * WWAの音声ファイルの管理を行うインターフェイスです。
 */
export interface WWAAudio {
    play(): void;
    pause(): void;
    skipTo(pos: number): void;
    isBgm(): boolean;
    isLoading(): boolean;
    isError(): boolean;
};

export interface AudioJSInstance {
    play(): void;
    pause(): void;
    skipTo(pos: number): void;
    element: HTMLAudioElement;
    loadedPercent: number
    wrapper: HTMLElement;
    buffer: any;
}

export class WWAAudioJS implements WWAAudio {
    private idx: number;
    private element: HTMLAudioElement;

    constructor(idx: number, file: string, parentNode: Node) {
        this.idx = idx;
        this.element = new Audio(file);
        this.element.preload = "auto";
        this.element.loop = this.isBgm();

        parentNode.appendChild(this.element);
    }

    public play(): void {
        this.element.play();
    }
    public pause(): void {
        this.element.pause();
    }
    public skipTo(pos: number): void {
        this.element.currentTime = pos;
    }
    public isBgm(): boolean {
        return this.idx >= SystemSound.BGM_LB;
    }
    public isLoading(): boolean {
        return this.element.readyState < 2;
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

    constructor(idx: number, audioContext, audioGain) {
        this.idx = idx;
        this.audioContext = audioContext;
        this.audioGain = audioGain;
        this.data = null;
        this.isLoaded = false;

        this.bufferSources = [];
        this.pos = 0;
    }

    public play(): void {
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

    public skipTo(pos: number): void {
        this.pos = pos;
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

    /**
     * WWAWebAudio では未対応です。
     */
    public isError(): boolean {
        return false;
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
