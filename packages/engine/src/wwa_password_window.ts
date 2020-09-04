import { WWA } from "./wwa_main";

export enum Mode {
    SAVE,
    LOAD
}
var DESCRIPTION_LOAD = (
    "下のボックスに前回のプレイで取得した\n" +
    "復帰用パスワードを貼り付けてください。\n" +
    "Java版WWAで取得したパスワードはご利用になれません。\n" +
    "作成者がマップの内容を変更した場合は\n" +
    "それ以前に取得したパスワードは使えなくなります。"
);

var DESCRIPTION_SAVE = (
    "下記テキストがデータ復帰用のパスワードになっています。\n" +
    "コピーしてメモ帳などのテキストエディタに貼り付けて\n" +
    "保存してください。"
);

export class PasswordWindow {
    private _element: HTMLDivElement;
    private _okButtonElement: HTMLButtonElement;
    private _cancelButtonElement: HTMLButtonElement;
    private _descriptionElement: HTMLDivElement;
    private _passwordBoxElement: HTMLTextAreaElement;
    private _buttonWrapperElement: HTMLDivElement;
    private _isVisible: boolean;

    private _mode: Mode;
    public constructor(private _wwa: WWA, private _parent: HTMLDivElement) {
        this._element = document.createElement("div");
        this._element.setAttribute("id", "wwa-password-window");
        this._element.style.display = "none";

        this._descriptionElement = document.createElement("div");
        this._descriptionElement.classList.add("wwa-password-description");

        this._passwordBoxElement = document.createElement("textarea");
        this._passwordBoxElement.setAttribute("cols", "50");
        this._passwordBoxElement.setAttribute("rows", "16");
        this._passwordBoxElement.addEventListener("focus", (e): void => {
            this._passwordBoxElement.select();
        });

        this._buttonWrapperElement = document.createElement("div");
        this._buttonWrapperElement.classList.add("wwa-password-submit");

        this._okButtonElement = document.createElement("button");
        this._okButtonElement.textContent = "OK";
        this._okButtonElement.addEventListener("click", (): void => {
            this._wwa.hidePasswordWindow()
        });
        this._cancelButtonElement = document.createElement("button");
        this._cancelButtonElement.textContent = "キャンセル";
        this._cancelButtonElement.addEventListener("click", (): void => {
            this._wwa.hidePasswordWindow(true);
        });

        this._buttonWrapperElement.appendChild(this._okButtonElement);
        this._buttonWrapperElement.appendChild(this._cancelButtonElement);
        this._mode = Mode.LOAD;

        this._element.appendChild(this._descriptionElement);
        this._element.appendChild(this._passwordBoxElement);
        this._element.appendChild(this._buttonWrapperElement);
        this._parent.appendChild(this._element);
        this.update();
    }
    get mode() {
        return this._mode;
    }

    set mode(mode: Mode) {
        this._mode = mode;
        if (mode === Mode.LOAD) {
            this.password = "";
        }
    }

    get password() {
        return this._passwordBoxElement.value;
    }

    set password(password: string) {
        this._passwordBoxElement.value = password;
    }

    public show(mode?: Mode): void {
        if (mode !== void 0) {
            this.mode = mode;
        }
        this._isVisible = true;
        this.update();
    }

    public hide(): void {
        this._isVisible = false;
        this.update();
    }

    public update() {
        var msg = "";
        if (this._mode === Mode.LOAD) {
            msg = DESCRIPTION_LOAD;
            try {
                this._passwordBoxElement.removeAttribute("readonly");
            } catch (e) { }
            this._cancelButtonElement.style.display = "inline";
        } else {
            msg = DESCRIPTION_SAVE;
            this._passwordBoxElement.setAttribute("readonly", "readonly");
            this._cancelButtonElement.style.display = "none";
        }
        var mesArray = msg.split("\n");
        this._descriptionElement.textContent = "";
        for (var i = 0; i < mesArray.length; i++) {
            var sp = document.createElement("span");
            sp.textContent = mesArray[i];
            this._descriptionElement.appendChild(sp);
            this._descriptionElement.appendChild(document.createElement("br"));
        }
        if (this._isVisible) {
            this._element.style.display = "block";
        } else {
            this._element.style.display = "none";
        }
    }

}

