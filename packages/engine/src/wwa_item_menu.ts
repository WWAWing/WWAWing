import * as Util from "./wwa_util";
import {
    WWAConsts,
    Direction
} from "./wwa_data";

export class ItemMenu {
    private static ROW_MAX: number = 8;
    private static COL_MAX: number = 3;
    private static DOM_ID_TABLE: Array<Array<string>> = [
        ["item0", "item1", "item2"],
        ["item3", "item4", "item5"],
        ["item6", "item7", "item8"],
        ["item9", "item10", "item11"],
        ["cell-load", "cell-load", "cell-load"],
        ["cell-save", "cell-save", "cell-save"],
        ["cell-restart", "cell-restart", "cell-restart"],
        ["cell-gotowwa", "cell-gotowwa", "cell-gotowwa"]
    ];
    private static CLICK_DOM_QUERY_TABLE: Array<Array<string>> = [
        ["#item0 .item-click-border", "#item1 .item-click-border", "#item2 .item-click-border"],
        ["#item3 .item-click-border", "#item4 .item-click-border", "#item5 .item-click-border"],
        ["#item6 .item-click-border", "#item7 .item-click-border", "#item8 .item-click-border"],
        ["#item9 .item-click-border", "#item10 .item-click-border", "#item11 .item-click-border"],
        ["#button-load", "#button-load", "#button-load"],
        ["#button-save", "#button-save", "#button-save"],
        ["#button-restart", "#button-restart", "#button-restart"],
        ["#button-gotowwa", " #button-gotowwa", "#button-gotowwa"]
    ];
    private col: number;
    private row: number;
    private counter: number;
    public update() {
        if (this.counter > 0) {
            this.counter--;
        }
    }
    private cursor_wait() {
        this.counter = WWAConsts.CONTROLL_WAIT_FRAME;
    }
    public allClear() {
        this.col = 0;
        this.row = 0;
        this.counter = 0;
    }
    public controll(moveDir: Direction) {
        if (this.counter > 0) {
            //カーソルリピート待機
            return;
        }
        switch (moveDir) {
            case Direction.DOWN:
                if (this.row < ItemMenu.ROW_MAX - 1) {
                    this.row++;
                    this.openView();
                    this.cursor_wait();
                }
                break;
            case Direction.UP:
                if (this.row > 0) {
                    this.row--;
                    this.openView();
                    this.cursor_wait();
                }
                break;
            case Direction.LEFT:
                if (this.col > 0) {
                    this.col--;
                    this.openView();
                    this.cursor_wait();
                }
                break;
            case Direction.RIGHT:
                if (this.col < ItemMenu.COL_MAX - 1) {
                    this.col++;
                    this.openView();
                    this.cursor_wait();
                }
                break;
        }
    }
    public ok() {
        this.close();
        //選択中のDOMと連動したDOMをクリック
        var elm: HTMLDivElement = null;
        elm = <HTMLDivElement>(Util.$qsh(ItemMenu.CLICK_DOM_QUERY_TABLE[this.row][this.col]));

        if (elm.classList.contains("item-click-border")) {
            //ITEM
        } else {
            this.allClear();
        }

        var evt = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        return elm.dispatchEvent(evt);
    }
    public ng() {
        this.close();

    }
    public close() {
        var elm: HTMLDivElement = null;
        var i, j;
        for (i = 0; i < ItemMenu.COL_MAX; i++) {
            for (j = 0; j < ItemMenu.ROW_MAX; j++) {
                elm = <HTMLDivElement>(Util.$id(ItemMenu.DOM_ID_TABLE[j][i]));
                if (elm.classList.contains("onpress")) {
                    elm.classList.remove("onpress");
                }
            }
        }
    }
    public openView() {
        this.close();
        var elm: HTMLDivElement = null;
        elm = <HTMLDivElement>(Util.$id(ItemMenu.DOM_ID_TABLE[this.row][this.col]));
        elm.classList.add("onpress");

    }
    public init() {
        this.allClear();
        this.openView();
    }

    constructor() {
        this.allClear();
    }
}

