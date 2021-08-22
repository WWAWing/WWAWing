/**
 * 原則, 出力先のHTMLファイル名はマップデータ名 (fileName) と同じですが,
 * outputPageName を指定することで, 出力先のファイル名をマップデータ名と違うものにできます.
 */
export default [
    { fileName: "test", title: "テストマップ" },
    { fileName: "wwamap", title: "Standard Map" },
    { fileName: "wwamap", outputPageName: "wwamap-classic", title: "Standard Map (Classic Mode)", cssName: "wwa_classic.css", isClassicMode: true as const },
    { fileName: "island02", title: "Fantasy Island" },
    { fileName: "caves01", title: "Cave Dungeon I" },
    { fileName: "caves02", title: "Cave Dungeon II" },
    { fileName: "g002-302", title: "追尾属性テスト (マップデータバージョン 3.0)" },
    { fileName: "g002-310", title: "追尾属性テスト (マップデータバージョン 3.1)" }
];
