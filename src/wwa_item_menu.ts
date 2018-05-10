
/// <reference path="./wwa_util.ts" />

module wwa_item_menu {

    export class ItemMenu {
        public static KEY_BUFFER_MAX = 256;
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
            ["#button-load", "button-load", "#button-load"],
            ["#button-save"      , "#button-save"    , "#button-save"],
            ["#button-restart"      , "#button-restart"   , "#button-restart"],
            ["#button-gotowwa"   , " #button-gotowwa", "#button-gotowwa"]
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
            this.counter = 6;
        }
        public allClear() {
            this.col = 0;
            this.row = 0;
            this.counter = 0;
        }
        public cursor_up() {
            if (this.counter > 0) {
                //カーソルリピート待機
                return;
            }
            if (this.row > 0) {
                this.row--;
                this.openView();
                this.cursor_wait();
            }

        }
        public cursor_down() {
            if (this.counter > 0) {
                //カーソルリピート待機
                return;
            }
            if (this.row < ItemMenu.ROW_MAX - 1) {
                this.row++;
                this.openView();
                this.cursor_wait();
            }
        }
        public cursor_left() {
            if (this.counter > 0) {
                //カーソルリピート待機
                return;
            }
            if (this.col > 0) {
                this.col--;
                this.openView();
                this.cursor_wait();
            }

        }
        public cursor_right() {
            if (this.counter > 0) {
                //カーソルリピート待機
                return;
            }
            if (this.col < ItemMenu.COL_MAX - 1) {
                this.col++;
                this.openView();
                this.cursor_wait();
            }
        }
        public ok() {
            this.close();
            //選択中のDOMと連動したDOMをクリック
            var elm: HTMLDivElement = null;
            elm = <HTMLDivElement>(wwa_util.$qsh(ItemMenu.CLICK_DOM_QUERY_TABLE[this.row][this.col]));

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
                    elm = <HTMLDivElement>(wwa_util.$id(ItemMenu.DOM_ID_TABLE[j][i]));
                    if (elm.classList.contains("onpress")) {
                        elm.classList.remove("onpress");
                    }
                }
            }
        }
        public openView() {
            this.close();
            var elm: HTMLDivElement = null;
            elm = <HTMLDivElement>(wwa_util.$id(ItemMenu.DOM_ID_TABLE[this.row][this.col]));
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

}