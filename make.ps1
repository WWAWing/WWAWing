tsc --sourceMap .\src\wwa_main.ts -t ES5 --outDir .. --out wwa.long.js.tmp
type wwa_license_comment.js wwa.long.js.tmp > wwa.long.js
echo "\n" >> wwa.long.js

java -jar .\closure\compiler.jar < wwa.link.js > wwa.js