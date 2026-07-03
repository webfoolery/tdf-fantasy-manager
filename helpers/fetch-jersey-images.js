// 1. RUN THE SCRIPT IN THE CONSOLE OF THE FANTASY TDF WEBSITE TO DOWNLOAD JERSEY IMAGE URLS
// 2. POWERSHELL SCRIPT IS NOW IN THE CLIPBOARD
// 3. CD TO THE TARGET DIRECTORY & PASTE THE SCRIPT TO DOWNLOAD THE IMAGES


const urls = [...new Set(
  performance
    .getEntriesByType("resource")
    .map(entry => entry.name)
    .filter(url => /\/assets\/img\/club\/m_letour26_.*\.png(\?v=\d+)?$/.test(url))
)];

const ps = `
$folder = Get-Location

$urls = @(
${urls.map(url => `  "${url}"`).join(",\n")}
)

foreach ($url in $urls) {
    $filename = [System.IO.Path]::GetFileName(([uri]$url).AbsolutePath)
    $out = Join-Path $folder $filename
    Write-Host "Downloading $filename"
    Invoke-WebRequest -Uri $url -OutFile $out
}

Write-Host "Done. Saved to $folder"
`;

copy(ps);

console.log(\`Copied PowerShell script for ${urls.length} images to clipboard.\`);
console.table(urls);