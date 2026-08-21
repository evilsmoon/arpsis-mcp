# ARPSIS MCP launcher for Cursor on Windows.
# Bun 1.3.x requires --cwd=PATH (equals form); space-separated --cwd PATH fails with "bun run" help + exit.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location -LiteralPath $Root
& "$env:USERPROFILE\.bun\bin\bun.exe" run src/index.ts
