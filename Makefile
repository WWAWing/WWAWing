.PHONY: all
all: wwa.long.js wwa.js

wwa.long.js: ./src/*.ts
	tsc --sourceMap ./src/wwa_main.ts -t ES5 --outDir .. --out $@

wwa.js: wwa.long.js closure/compiler.jar
	java -jar ./closure/compiler.jar < $< > $@

.PHONY: clean
clean:
	$(RM) wwa.long.js wwa.js


