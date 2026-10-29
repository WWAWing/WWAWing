# node.exe を指定バージョンに更新する PowerShell スクリプトです。
# node.exe から署名を削除するために signtool が必要です。
#
# 下記から Windows SDK をインストールすることで signtool が使えるようになります。
# https://developer.microsoft.com/ja-jp/windows/downloads/windows-sdk/
#
# 必要であれば、PowerShell の実行ポリシーを変更してください。
# Example:
#   Set-ExecutionPolicy -ExecutionPolicy Unrestricted -scope Process
#
# ダウンロードする Node.js のバージョンは、リポジトリルートの .node-version から読み込みます。
$nodeVersionFile = Join-Path $PSScriptRoot "..\..\.node-version"
$version = "v" + (Get-Content "$nodeVersionFile" -TotalCount 1).Trim().TrimStart("v")
Push-Location "$PSScriptRoot\exe"
if (Test-Path node.exe) {
    Remove-Item node.exe
}
Invoke-WebRequest "https://nodejs.org/dist/$version/node-$version-win-x64.zip" -OutFile node.zip
Expand-Archive node.zip
Move-Item "node\node-$version-win-x64\node.exe" .
Remove-Item -Recurse node.zip, node
signtool remove /s node.exe
Pop-Location
