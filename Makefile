.PHONY: all
all: wwa.long.js wwa.js

wwa.long.js: *.ts
	tsc --sourceMap wwa_main.ts -t ES5 --out $@

wwa.js: wwa.long.js closure/compiler.jar
	java -jar ./closure/compiler.jar < $< > $@

.PHONY: clean
clean:
	$(RM) wwa.long.js wwa.js


