.PHONY: all
all: wwa.long.js wwa.js

wwa.long.js: ./src/*.ts wwa_license_comment.js
	tsc --sourceMap ./src/wwa_main.ts -t ES5 --outDir .. --out wwa.long.js.tmp
	cat wwa_license_comment.js wwa.long.js.tmp > $@
	echo "\n" >> $@

wwa.link.js: wwa_license_comment.js wwa.long.js cryptojs/aes.js
	echo "\n" >> $@
	cat wwa.long.js cryptojs/aes.js > $@

wwa.js: wwa.link.js closure/compiler.jar
	java -jar ./closure/compiler.jar < $< > $@

.PHONY: clean
clean:
	$(RM) wwa.long.js wwa.long.js.tmp wwa.link.js wwa.js


