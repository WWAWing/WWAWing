import { SystemSound } from './wwa_data';

/**
 * WWAの音声ファイルの管理を行うインターフェイスです。
 */
export interface WWAAudio {
    play(): void;
    pause(): void;
    skipTo(pos: number): void;
    isBgm(): boolean;
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

export interface AudiojsTScomp {
    create(a, b?): AudioJSInstance;
}

export class WWAWebAudio implements WWAAudio {
    private idx: number;
    private audioContext;
    private audioGain;
    private data: any;
    private isLoaded: boolean;
    private buffer_sources: AudioBufferSourceNode[];
    private pos: number;

    constructor(idx: number, audioContext, audioGain) {
        this.idx = idx;
        this.audioContext = audioContext;
        this.audioGain = audioGain;
        this.data = null;
        this.isLoaded = false;

        this.buffer_sources = [];
        this.pos = 0;
    }

    public play(): void {
        var audioContext = this.audioContext;
        var gainNode = this.audioGain;
        var buffer_source: AudioBufferSourceNode = null;

        buffer_source = audioContext.createBufferSource();
        this.buffer_sources.push(buffer_source);

        buffer_source.buffer = this.data;
        if (this.isBgm) {
            buffer_source.loop = true;
        }
        buffer_source.connect(gainNode);

        //gainNode.gain.setValueAtTime(1, audioContext.currentTime);
        // TODO(rmn): buffer_source.buffer.duration ? あとで調べる
        var duration = (buffer_source as any).duration;
        if ((!isFinite(duration)) || (duration < 0) || (typeof duration !== "number")) {
            duration = 0;
        }
        buffer_source.start(0, this.pos * duration);
        buffer_source.onended = function () {
            var id: number = this.buffer_sources.indexOf(buffer_source);
            if (id !== -1) {
                this.buffer_sources.splice(id, 1);
            }
            try {
                buffer_source.stop();
            } catch (e) {

            }
            buffer_source.onended = null;
        }.bind(this);
        gainNode.connect(audioContext.destination);
    }

    public pause(): void {
        var len: number = this.buffer_sources.length;
        var i: number;
        var buffer_source: AudioBufferSourceNode = null;
        for (i = 0; i < len; i++) {
            buffer_source = this.buffer_sources[i];
            try {
                buffer_source.stop();
            } catch (e) {

            }
            buffer_source.onended = null;
        }
        this.buffer_sources.length = 0;
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
     * 音声データをセットします。
     */
    public setData(data): void {
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
