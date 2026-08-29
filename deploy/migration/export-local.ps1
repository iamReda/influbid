param(
	[Parameter(Mandatory = $true)]
	[string]$ProjectRoot,

	[Parameter(Mandatory = $true)]
	[string]$OutputDirectory,

	[string]$ProtectedAdminEmail = "hello@minuit.studio"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Get-DotEnvValue {
	param(
		[Parameter(Mandatory = $true)]
		[string]$FilePath,

		[Parameter(Mandatory = $true)]
		[string]$Name,

		[switch]$Optional
	)

	$line = Get-Content -LiteralPath $FilePath |
		Where-Object { $_ -match "^\s*$([regex]::Escape($Name))\s*=" } |
		Select-Object -Last 1

	if (-not $line) {
		if ($Optional) {
			return $null
		}
		throw "Missing $Name in $FilePath"
	}

	$value = ($line -replace "^\s*$([regex]::Escape($Name))\s*=", "").Trim()
	if ($value.StartsWith('"') -or $value.StartsWith("'")) {
		$quote = $value.Substring(0, 1)
		$closingQuote = $value.LastIndexOf($quote)
		if ($closingQuote -le 0) {
			throw "Unterminated quoted value for $Name in $FilePath"
		}
		$value = $value.Substring(1, $closingQuote - 1)
	} else {
		$value = ($value -replace "\s+#.*$", "").Trim()
	}

	if ([string]::IsNullOrWhiteSpace($value)) {
		if ($Optional) {
			return $null
		}
		throw "$Name is empty in $FilePath"
	}

	return $value
}

function Resolve-PostgresCommand {
	param([Parameter(Mandatory = $true)][string]$Name)

	$command = Get-Command $Name -ErrorAction SilentlyContinue
	if ($command) {
		return $command.Source
	}

	$candidates = @(
		"$env:ProgramFiles\PostgreSQL\*\bin\$Name.exe",
		"$env:ProgramFiles\pgAdmin 4\runtime\$Name.exe",
		"$env:LOCALAPPDATA\Programs\PostgreSQL\*\bin\$Name.exe"
	)

	$match = Get-ChildItem -Path $candidates -File -ErrorAction SilentlyContinue |
		Sort-Object FullName -Descending |
		Select-Object -First 1

	if (-not $match) {
		throw "Required PostgreSQL command '$Name' was not found. Install PostgreSQL 16 command-line tools."
	}

	return $match.FullName
}

$resolvedProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$envFile = Join-Path $resolvedProjectRoot ".env.local"
if (-not (Test-Path -LiteralPath $envFile -PathType Leaf)) {
	throw "Local environment file not found: $envFile"
}

$pgDump = Resolve-PostgresCommand "pg_dump"
$psql = Resolve-PostgresCommand "psql"

$pgDumpVersion = (& $pgDump --version | Out-String).Trim()
if ($pgDumpVersion -notmatch "(\d+)(?:\.\d+)?$") {
	throw "Unable to determine pg_dump version."
}
$pgDumpMajor = [int]$Matches[1]
if ($pgDumpMajor -notin @(16, 17)) {
	throw "Only PostgreSQL 16 and 17 pg_dump clients are supported by this migration."
}

$databaseUrl = Get-DotEnvValue -FilePath $envFile -Name "DATABASE_URL"
if ($databaseUrl -notmatch "^postgres(?:ql)?://") {
	throw "DATABASE_URL must be a PostgreSQL connection URL."
}
if ($ProtectedAdminEmail -notmatch "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$") {
	throw "ProtectedAdminEmail is invalid."
}

New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$resolvedOutput = (Resolve-Path -LiteralPath $OutputDirectory).Path
$payloadDirectory = Join-Path $resolvedOutput "payload"
$archivePath = Join-Path $resolvedOutput "influbid-local-migration.zip"

if (Test-Path -LiteralPath $payloadDirectory) {
	Remove-Item -LiteralPath $payloadDirectory -Recurse -Force
}
if (Test-Path -LiteralPath $archivePath) {
	Remove-Item -LiteralPath $archivePath -Force
}

New-Item -ItemType Directory -Path $payloadDirectory -Force | Out-Null
$dumpPath = Join-Path $payloadDirectory "database.dump"
$avatarsDestination = Join-Path $payloadDirectory "avatars"
New-Item -ItemType Directory -Path $avatarsDestination -Force | Out-Null

Write-Host "Checking protected production admin collision in the local database..."
$adminQuery = "SELECT email FROM public.`"user`" WHERE lower(email) = lower('$ProtectedAdminEmail') LIMIT 1;"
$adminCollision = & $psql `
	"--dbname=$databaseUrl" `
	"--tuples-only" `
	"--no-align" `
	"--set=ON_ERROR_STOP=1" `
	"--command" `
	$adminQuery

if ($LASTEXITCODE -ne 0) {
	throw "Unable to query the local PostgreSQL database."
}
if (-not [string]::IsNullOrWhiteSpace(($adminCollision | Out-String))) {
	throw "The local database contains protected admin '$ProtectedAdminEmail'. Remove or rename that local account before migration."
}

Write-Host "Exporting the local PostgreSQL database..."
& $pgDump `
	"--dbname=$databaseUrl" `
	"--format=custom" `
	"--no-owner" `
	"--no-acl" `
	"--file=$dumpPath"

if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $dumpPath -PathType Leaf)) {
	throw "pg_dump failed."
}

$configuredStoragePath = Get-DotEnvValue -FilePath $envFile -Name "STORAGE_LOCAL_PATH" -Optional
$avatarCandidates = @()
if ($configuredStoragePath) {
	$storageRoot = if ([IO.Path]::IsPathRooted($configuredStoragePath)) {
		$configuredStoragePath
	} else {
		Join-Path $resolvedProjectRoot $configuredStoragePath
	}
	$avatarCandidates += Join-Path $storageRoot "avatars"
}
$avatarCandidates += @(
	(Join-Path $resolvedProjectRoot "apps\saas\.local-storage\avatars"),
	(Join-Path $resolvedProjectRoot ".local-storage\avatars")
)
$avatarSource = $avatarCandidates |
	Where-Object { Test-Path -LiteralPath $_ -PathType Container } |
	Select-Object -First 1

$avatarCount = 0
if ($avatarSource) {
	Write-Host "Copying avatars from $avatarSource..."
	Get-ChildItem -LiteralPath $avatarSource -File -Recurse | ForEach-Object {
		$relativePath = $_.FullName.Substring($avatarSource.Length).TrimStart([char[]]"\/")
		$destination = Join-Path $avatarsDestination $relativePath
		New-Item -ItemType Directory -Path (Split-Path $destination -Parent) -Force | Out-Null
		Copy-Item -LiteralPath $_.FullName -Destination $destination -Force
		$avatarCount += 1
	}
} else {
	Write-Warning "No local avatar directory was found. The database will still be migrated."
}

$manifest = [ordered]@{
	createdAtUtc          = [DateTime]::UtcNow.ToString("o")
	sourceProject         = $resolvedProjectRoot
	protectedAdminEmail  = $ProtectedAdminEmail
	avatarCount           = $avatarCount
	excludedOnImport      = @("session", "verification")
}
$manifest |
	ConvertTo-Json -Depth 4 |
	Set-Content -LiteralPath (Join-Path $payloadDirectory "manifest.json") -Encoding UTF8
$pgDumpMajor | Set-Content -LiteralPath (Join-Path $payloadDirectory "pg-dump-major.txt") -Encoding ASCII

Write-Host "Creating migration archive..."
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::Open($archivePath, [IO.Compression.ZipArchiveMode]::Create)
try {
	Get-ChildItem -LiteralPath $payloadDirectory -File -Recurse | ForEach-Object {
		$entryName = $_.FullName.Substring($payloadDirectory.Length).TrimStart([char[]]"\/").Replace("\", "/")
		[IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
			$zip,
			$_.FullName,
			$entryName,
			[IO.Compression.CompressionLevel]::Optimal
		) | Out-Null
	}
} finally {
	$zip.Dispose()
}
if (-not (Test-Path -LiteralPath $archivePath -PathType Leaf)) {
	throw "Unable to create the migration archive."
}

$archiveHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
Write-Host "Migration archive ready: $archivePath"
Write-Host "Avatars included: $avatarCount"
Write-Host "SHA256: $archiveHash"

if ($env:GITHUB_OUTPUT) {
	"archive_path=$archivePath" | Out-File -FilePath $env:GITHUB_OUTPUT -Encoding utf8 -Append
	"archive_sha256=$archiveHash" | Out-File -FilePath $env:GITHUB_OUTPUT -Encoding utf8 -Append
}
