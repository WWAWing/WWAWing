mkdir wwawing_dist
mkdir wwawing_update
cd wwawing_dist
mkdir wwa_debugger_installer
cd wwa_debugger_installer
copy ..\..\..\debugger\installer.bat .
copy ..\..\..\debugger\uninstaller.bat
cd ..
copy ..\..\debugger\readme.txt README_WWADebugger.txt
copy ..\..\debugger\"WWA Debugger.exe" .
copy ..\..\debugger\WWADebuggerÇÕä«óùé“å†å¿Ç≈é¿çsÇµÇƒÇ≠ÇæÇ≥Ç¢ .
copy ..\..\wwamk310\WinWwamk.exe .
copy ..\..\wwamk310\çÏê¨ÉcÅ[ÉãÇ…Ç¬Ç¢Çƒ.txt .
copy ..\..\manual.html .
mkdir mapdata
cd mapdata
copy ..\..\..\caves01.dat .
copy ..\..\..\caves01.gif .
copy ..\..\..\dist_html\caves01.html .
copy ..\..\..\caves02.dat .
copy ..\..\..\caves02.gif .
copy ..\..\..\dist_html\caves02.html .
copy ..\..\..\cover.gif .
copy ..\..\..\island02.dat .
copy ..\..\..\island02.gif .
copy ..\..\..\dist_html\island02.html .
copy ..\..\..\making.gif .
copy ..\..\..\mapcg.gif .
copy ..\..\..\style.css .
copy ..\..\..\wwa.css .
copy ..\..\..\wwa.js .
copy ..\..\..\wwaload.js .
copy ..\..\..\dist_html\wwamap.html .
copy ..\..\..\wwawing-disp.png .
copy ..\..\..\wwamap.dat .
mkdir backup
mkdir audio
xcopy ..\..\..\audio audio
cd ..\..\wwawing_update
copy ..\..\wwa.css .
copy ..\..\style.css .
copy ..\..\wwa.js .
copy ..\..\wwaload.js .
copy ..\..\manual.html .
cd ..
echo "Done. Please compress into zip and upload them."
pause
