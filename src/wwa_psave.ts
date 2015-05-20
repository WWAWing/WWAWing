/// <reference path="./wwa_data.ts" />

module wwa_psave {
    var pressData: Uint8Array;
    var VALUE_MAX = 65000;
    var MASK_BIG    =  0xFF00;
    var MASK_LITTLE =  0x00FF;

    export function getPressData(): Uint8Array {
        return　pressData;
    }

    function pressToBuffer(
        pos: number,
        value: number,
        useMax: boolean = false) {
        if( useMax ) {
            value = Math.max( VALUE_MAX, value );
        }
        pressData[ pos ] = value;

    }

    export function createSavePassword(
        wwaData: wwa_data.WWAData ): string {
        var map: Uint8Array;
        if( pressData === void 0 || pressData === null ) {
            pressData = new Uint8Array(
                wwaData.mapWidth * wwaData.mapWidth * 4
            );
        }

//        pressToBuffer();


        return "";
    }

}