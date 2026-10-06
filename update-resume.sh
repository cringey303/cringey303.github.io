#!/usr/bin/env bash
# Publishes a new resume PDF to lucasroot.org.
#
# Export the PDF from Overleaf, then run this. It finds the download, copies
# it over content/lucasrootresume.pdf, commits, and pushes. GitHub Pages
# redeploys on its own. Works on macOS and in Git Bash on Windows.
#
#   ./update-resume.sh              newest resume-looking PDF in ~/Downloads or ~/Documents
#   ./update-resume.sh -p FILE      use a specific file
#   ./update-resume.sh -y           skip the confirmation prompt

set -euo pipefail

repo="$(cd "$(dirname "$0")" && pwd)"
target="$repo/content/lucasrootresume.pdf"

fail() { printf '\n  %s\n\n' "$1" >&2; exit 1; }

src="" yes=""
while getopts "p:y" opt; do
    case "$opt" in
        p) src="$OPTARG" ;;
        y) yes=1 ;;
        *) fail "Usage: $0 [-p FILE] [-y]" ;;
    esac
done

# --- Locate the PDF -------------------------------------------------------

if [ -n "$src" ]; then
    [ -f "$src" ] || fail "No such file: $src"
else
    # Prefer something that looks like a resume; fall back to newest PDF,
    # since Overleaf sometimes exports as the project name.
    shopt -s nullglob nocaseglob
    pdfs=("$HOME"/Downloads/*.pdf "$HOME"/Documents/*.pdf)
    shopt -u nullglob nocaseglob
    [ "${#pdfs[@]}" -gt 0 ] || fail "No PDFs in ~/Downloads or ~/Documents. Pass -p instead."

    newest="" resume=""
    while IFS= read -r f; do
        [ -z "$newest" ] && newest="$f"
        case "$(basename "$f" | tr '[:upper:]' '[:lower:]')" in
            *resum*|*cv*) resume="$f"; break ;;
        esac
    done <<< "$(ls -t "${pdfs[@]}")"

    src="${resume:-$newest}"
    [ -n "$src" ] || fail "No PDFs in ~/Downloads or ~/Documents. Pass -p instead."
fi

# --- Sanity-check it ------------------------------------------------------

# Guard against a half-finished download or a wrongly-named file: a real PDF
# starts with the bytes "%PDF".
[ "$(head -c 4 "$src")" = "%PDF" ] ||
    fail "$(basename "$src") is not a valid PDF (missing %PDF header). Still downloading?"

if [ -n "$(find "$src" -mmin +60)" ]; then
    echo "  Heads up: that file is over an hour old. Is it the export you meant?"
fi

if [ -f "$target" ] && cmp -s "$src" "$target"; then
    printf '\n  Identical to the published resume. Nothing to do.\n\n'
    exit 0
fi

# --- Confirm --------------------------------------------------------------

printf '\n  Publishing to lucasroot.org\n'
printf '    from  %s\n' "$src"
printf '    size  %s KB\n' "$(( $(wc -c < "$src") / 1024 ))"

# date -r reads a file's mtime on GNU and recent macOS; stat covers older macOS.
fmt='%b %d, %Y at %I:%M %p'
modified="$(date -r "$src" "+$fmt" 2>/dev/null || stat -f '%Sm' -t "$fmt" "$src")"
printf '    last modified  %s\n\n' "$modified"

if [ -z "$yes" ]; then
    # This pushes to the live site, so make it a deliberate keystroke.
    read -r -p "  Push this live? [y/N] " reply
    case "$reply" in
        y|Y|yes|YES) ;;
        *) printf '  Cancelled.\n\n'; exit 0 ;;
    esac
fi

# --- Publish --------------------------------------------------------------

cp "$src" "$target"
cd "$repo"
git add -- content/lucasrootresume.pdf

# Nothing staged means the bytes matched something git already had.
if git diff --cached --quiet; then
    printf '\n  No change to commit.\n\n'
    exit 0
fi

git commit -m "update resume ($(date '+%b %d, %Y'))"
git push || fail "Push failed - commit is saved locally, so just fix the remote and re-push."

printf '\n  Live at https://lucasroot.org/resume\n'
printf '  Pages takes a minute or two, and caches for ~10 after that.\n\n'
