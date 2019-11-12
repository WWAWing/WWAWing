import makeDistribution from "./make-wwawing-dist";
import makeZip from "./make-zip";

async function main() {
    await Promise.all([
        // 完全版配布物を生成
        makeDistribution(false, true),
        // 更新版配布物を生成
        makeDistribution(true, true)
    ]).catch(e => {
        console.error(e);
        process.exit(1);
    });
    await Promise.all([
        makeZip("wwawing-dist"),
        makeZip("wwawing-update")
    ]).catch(e => {
        console.error(e);
        process.exit(1);
    });
}

main();
