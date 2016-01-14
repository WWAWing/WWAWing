.PHONY: all
all: wwawing_dist wwawing_update
.PHONY: zip
zip: wwawing_dist.zip wwawing_update.zip
wwawing_dist: ../LICENSE ../debugger/installer.bat ../debugger/uninstaller.bat ../debugger/readme.txt ../debugger/WWA\ Debugger.exe ../wwamk310/WinWwamk.exe ../manual.html ../caves01.dat ../caves01.gif ../dist_html/caves01.html ../caves02.dat ../caves02.gif ../dist_html/caves02.html ../classictitle.gif ../cover.gif ../island02.dat ../island02.gif ../dist_html/island02.html ../making.gif ../mapcg.gif ../style.css ../wwa.css ../wwa.js ../wwaload.js ../dist_html/wwamap.html ../wwawing-disp.png ../wwamap.dat ../audio
	mkdir wwawing_dist.tmp
	cd wwawing_dist.tmp; \
	cp ../../LICENSE .; \
	mkdir wwa_debugger_installer; \
	cd wwa_debugger_installer; \
	cp ../../../debugger/installer.bat .; \
	cp ../../../debugger/uninstaller.bat .; \
	cd ..; \
	cp ../../debugger/readme.txt README_WWADebugger.txt; \
	cp ../../debugger/'WWA Debugger.exe' .; \
	cp ../../wwamk310/WinWwamk.exe .; \
	cp ../../manual.html .; \
	mkdir mapdata; \
	cd mapdata; \
	cp ../../../caves01.dat .; \
	cp ../../../caves01.gif .; \
	cp ../../../dist_html/caves01.html .; \
	cp ../../../caves02.dat .; \
	cp ../../../caves02.gif .; \
	cp ../../../dist_html/caves02.html .; \
	cp ../../../classictitle.gif .; \
	cp ../../../cover.gif .; \
	cp ../../../island02.dat .; \
	cp ../../../island02.gif .; \
	cp ../../../dist_html/island02.html .; \
	cp ../../../making.gif .; \
	cp ../../../mapcg.gif .; \
	cp ../../../style.css .; \
	cp ../../../wwa.css .; \
	cp ../../../wwa.js .; \
	cp ../../../wwaload.js .; \
	cp ../../../dist_html/wwamap.html .; \
	cp ../../../wwawing-disp.png .; \
	cp ../../../wwamap.dat . ; \
	mkdir backup; \
	mkdir audio; \
	cp -R ../../../audio .
	mv wwawing_dist.tmp $@

wwawing_dist.zip: wwawing_dist
#	convmv -f utf-8 -t cp932 -r --notest wwawing_dist/
	zip -r $@ wwawing_dist
#	convmv -f cp932 -t utf-8 -r --notest wwawing_dist/

wwawing_update: ../LICENSE ../wwa.css ../style.css ../wwa.js ../wwaload.js ../manual.html
	mkdir wwawing_update.tmp
	cp ../LICENSE wwawing_update.tmp
	cp ../wwa.css wwawing_update.tmp
	cp ../style.css wwawing_update.tmp
	cp ../wwa.js wwawing_update.tmp
	cp ../wwaload.js wwawing_update.tmp
	cp ../manual.html wwawing_update.tmp
	mv wwawing_update.tmp $@

wwawing_update.zip: wwawing_update
#	convmv -f utf-8 -t cp932 -r --notest wwawing_update/
	zip -r $@ wwawing_update
#	convmv -f cp932 -t utf-8 -r --notest wwawing_update/

.PHONY: clean
clean:
	$(RM) -r wwawing_dist
	$(RM) -r wwawing_dist.tmp
	$(RM) -r wwawing_update
	$(RM) -r wwawing_update.tmp
	$(RM) wwawing_dist.zip
	$(RM) wwawing_update.zip


