.PHONY: all
all: wwawing_dist.zip wwawing_update.zip

wwawing_dist.zip: ../debugger/installer.bat ../debugger/uninstaller.bat ../debugger/readme.txt ../debugger/WWA\ Debugger.exe ../wwamk310/WinWwamk.exe ../wwamk310/作成ツールについて.txt ../manual.html ../caves01.dat ../caves01.gif ../dist_html/caves01.html ../caves02.dat ../caves02.gif ../dist_html/caves02.html ../cover.gif ../island02.dat ../island02.gif ../dist_html/island02.html ../making.gif ../mapcg.gif ../style.css ../wwa.css ../wwa.js ../wwaload.js ../dist_html/wwamap.html ../wwawing-disp.png ../wwamap.dat ../audio
	mkdir wwawing_dist
	cd wwawing_dist; \
	mkdir wwa_debugger_installer; \
	cd wwa_debugger_installer; \
	cp ../../../debugger/installer.bat .; \
	cp ../../../debugger/uninstaller.bat .; \
	cd ..; \
	cp ../../debugger/readme.txt README_WWADebugger.txt; \
	cp ../../debugger/'WWA Debugger.exe' .; \
	cp ../../debugger/WWADebuggerは管理者権限で実行してください .; \
	cp ../../wwamk310/WinWwamk.exe .; \
	cp ../../wwamk310/作成ツールについて.txt .; \
	cp ../../manual.html .; \
	mkdir mapdata; \
	cd mapdata; \
	cp ../../../caves01.dat .; \
	cp ../../../caves01.gif .; \
	cp ../../../dist_html/caves01.html .; \
	cp ../../../caves02.dat .; \
	cp ../../../caves02.gif .; \
	cp ../../../dist_html/caves02.html .; \
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
	zip -r $@ wwawing_dist

wwawing_update.zip:
	mkdir wwawing_update
	cp ../wwa.css wwawing_update
	cp ../style.css wwawing_update
	cp ../wwa.js wwawing_update
	cp ../wwaload.js wwawing_update
	cp ../manual.html wwawing_update
	zip -r $@ wwawing_update

.PHONY: clean
clean:
	$(RM) -r wwawing_dist
	$(RM) -r wwawing_update
	$(RM) wwawing_dist.zip
	$(RM) wwawing_update.zip


