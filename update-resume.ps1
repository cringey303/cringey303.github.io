<#
.SYNOPSIS
    Publishes a new resume PDF to lucasroot.org.

.DESCRIPTION
    Workflow: export the PDF from Overleaf, then run this. It finds the
    download, copies it into content/, commits, and pushes. GitHub Pages
    redeploys on its own.

    You do NOT need to move the file into content/ yourself — that is this
    script's job. Just let it land in Downloads.

.EXAMPLE
    .\update-resume.ps1
    Uses the newest resume-looking PDF in your Downloads folder.

.EXAMPLE
    .\update-resume.ps1 -Path C:\some\other\place\resume.pdf
    Uses a specific file.

.EXAMPLE
    .\update-resume.ps1 -Yes
    Skips the confirmation prompt.
#>

[CmdletBinding()]
param(
    [string]$Path,
    [switch]$Yes
)

$ErrorActionPreference = 'Stop'

# Everything is resolved relative to the script, so it works from any cwd.
$repo   = $PSScriptRoot
$target = Join-Path $repo 'content\lucasrootresume.pdf'

function Fail($msg) {
    Write-Host "`n  $msg`n" -ForegroundColor Red
    exit 1
}

# --- Locate the PDF -------------------------------------------------------

if ($Path) {
    if (-not (Test-Path -LiteralPath $Path)) { Fail "No such file: $Path" }
    $src = Get-Item -LiteralPath $Path
}
else {
    $downloads = Join-Path $HOME 'Downloads'
    if (-not (Test-Path -LiteralPath $downloads)) { Fail "No Downloads folder found. Pass -Path instead." }

    # Prefer something that looks like a resume; fall back to newest PDF,
    # since Overleaf sometimes exports as the project name.
    $candidates = Get-ChildItem -LiteralPath $downloads -Filter *.pdf -File |
                  Sort-Object LastWriteTime -Descending

    if (-not $candidates) { Fail "No PDFs in $downloads. Pass -Path instead." }

    $src = $candidates | Where-Object { $_.Name -match 'resum|cv' } | Select-Object -First 1
    if (-not $src) { $src = $candidates | Select-Object -First 1 }
}

# --- Sanity-check it ------------------------------------------------------

# Guard against a half-finished download or a wrongly-named file: a real PDF
# starts with the bytes "%PDF".
$head = Get-Content -LiteralPath $src.FullName -Encoding Byte -TotalCount 4
if (-not $head -or ($head.Count -lt 4) -or
    ([System.Text.Encoding]::ASCII.GetString($head) -ne '%PDF')) {
    Fail "$($src.Name) is not a valid PDF (missing %PDF header). Still downloading?"
}

$age = [int]((Get-Date) - $src.LastWriteTime).TotalMinutes
if ($age -gt 60) {
    Write-Host "  Heads up: that file is $age minutes old. Is it the export you meant?" -ForegroundColor Yellow
}

if (Test-Path -LiteralPath $target) {
    $a = (Get-FileHash -LiteralPath $src.FullName -Algorithm SHA256).Hash
    $b = (Get-FileHash -LiteralPath $target      -Algorithm SHA256).Hash
    if ($a -eq $b) {
        Write-Host "`n  Identical to the published resume. Nothing to do.`n" -ForegroundColor Green
        exit 0
    }
}

# --- Confirm --------------------------------------------------------------

$kb = [math]::Round($src.Length / 1KB)
Write-Host ""
Write-Host "  Publishing to lucasroot.org" -ForegroundColor Cyan
Write-Host "    from  $($src.FullName)"
Write-Host "    size  $kb KB, modified $($src.LastWriteTime.ToString('MMM d, h:mm tt'))"
Write-Host ""

if (-not $Yes) {
    # This pushes to the live site, so make it a deliberate keystroke.
    $reply = Read-Host "  Push this live? [y/N]"
    if ($reply -notmatch '^(y|yes)$') {
        Write-Host "  Cancelled.`n"
        exit 0
    }
}

# --- Publish --------------------------------------------------------------

Copy-Item -LiteralPath $src.FullName -Destination $target -Force

Push-Location $repo
try {
    git add -- 'content/lucasrootresume.pdf'

    # Nothing staged means the bytes matched something git already had.
    git diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n  No change to commit.`n" -ForegroundColor Green
        exit 0
    }

    git commit -m "update resume ($(Get-Date -Format 'MMM d, yyyy'))"
    if (-not $?) { Fail "Commit failed." }

    git push
    if (-not $?) { Fail "Push failed - commit is saved locally, so just fix the remote and re-push." }
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "  Live at https://lucasroot.org/resume" -ForegroundColor Green
Write-Host "  Pages takes a minute or two, and caches for ~10 after that." -ForegroundColor DarkGray
Write-Host ""
