import { SystemSound } from '../wwa_data';
import WWAAudio from './WWAAudio';

/**
 * WWAAudioElement は、 audio 要素を内部で配置して、再生の際に再生する方式です。
 * IE といった Web Audio API が利用できない場合はこの WWAAudioElement を利用します。
 */
export default class WWAAudioElement implements WWAAudio {
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
