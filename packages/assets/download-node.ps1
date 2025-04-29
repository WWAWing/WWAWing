# node.exe を指定バージョンに更新する PowerShell スクリプトです。

# node.exe から署名を削除するために signtool が必要です。
# 下記から Windows SDK をインストールすることで signtool が使えるようになります。
# https://developer.microsoft.com/ja-jp/windows/downloads/windows-sdk/

# ダウンロードしたい Node.js のバージョンに合わせてください
#
# Example:
#   $version="v22.15.0"
$version="v22.15.0"

Set-Location "$PSScriptRoot\exe"
Remove-Item node.exe
Invoke-WebRequest "https://nodejs.org/dist/$version/node-$version-win-x64.zip" -OutFile node.zip
Expand-Archive node.zip
Move-Item "node\node-$version-win-x64\node.exe" .
Remove-Item node.zip node
signtool /s node.exe
