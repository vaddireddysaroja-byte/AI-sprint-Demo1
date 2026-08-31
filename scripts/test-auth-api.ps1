# Auth API local test script (PowerShell)
# Usage:
#   1. Apply D1 migration locally: npx wrangler d1 migrations apply ai-sprint-demo1-db --local
#   2. Set SESSION_SECRET in .dev.vars
#   3. Start Workers runtime: npm run preview
#   4. Run: .\scripts\test-auth-api.ps1

$BaseUrl = "http://127.0.0.1:8787"
$CookieFile = Join-Path $env:TEMP "ai-sprint-demo1-auth-cookie.txt"

function Invoke-AuthRequest {
	param(
		[string]$Method,
		[string]$Path,
		[string]$JsonBody = $null,
		[switch]$UseCookie,
		[switch]$SaveCookie
	)

	$args = @(
		"-s",
		"-X", $Method,
		"-H", "Content-Type: application/json"
	)

	if ($UseCookie -and (Test-Path $CookieFile)) {
		$args += @("-b", $CookieFile)
	}

	if ($SaveCookie) {
		$args += @("-c", $CookieFile)
	}

	if ($JsonBody) {
		$args += @("-d", $JsonBody)
	}

	$args += "$BaseUrl$Path"

	Write-Host ""
	Write-Host ">>> $Method $Path" -ForegroundColor Cyan
	curl.exe @args
	Write-Host ""
}

Remove-Item $CookieFile -ErrorAction SilentlyContinue

Invoke-AuthRequest -Method POST -Path "/api/register" -SaveCookie -JsonBody '{"username":"testuser","email":"test@example.com","password":"password123","confirmPassword":"password123"}'
Invoke-AuthRequest -Method GET -Path "/api/session" -UseCookie
Invoke-AuthRequest -Method POST -Path "/api/logout" -UseCookie
Invoke-AuthRequest -Method GET -Path "/api/session" -UseCookie
Invoke-AuthRequest -Method POST -Path "/api/login" -SaveCookie -JsonBody '{"email":"test@example.com","password":"password123"}'
Invoke-AuthRequest -Method GET -Path "/api/session" -UseCookie
Invoke-AuthRequest -Method POST -Path "/api/register" -JsonBody '{"username":"testuser","email":"test@example.com","password":"password123","confirmPassword":"password123"}'
Invoke-AuthRequest -Method POST -Path "/api/login" -SaveCookie -JsonBody '{"email":"test@example.com","password":"wrongpass"}'

Write-Host "Done. Cookie file: $CookieFile" -ForegroundColor Green
