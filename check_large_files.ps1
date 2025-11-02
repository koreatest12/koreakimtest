# C:\ 드라이브의 대용량 파일 검색

Write-Host "상위 20개 대용량 파일 검색 중..." -ForegroundColor Green
Write-Host "=" * 100

$largeFiles = Get-ChildItem 'C:\' -Recurse -File -ErrorAction SilentlyContinue |
    Sort-Object Length -Descending |
    Select-Object -First 20

foreach($file in $largeFiles) {
    $sizeMB = [math]::Round($file.Length/1MB, 2)
    $sizeGB = [math]::Round($file.Length/1GB, 2)

    $sizeDisplay = if ($sizeGB -ge 1) { "$sizeGB GB" } else { "$sizeMB MB" }

    Write-Host ("{0,-60} {1,15} {2}" -f $file.Name.Substring(0, [Math]::Min(60, $file.Name.Length)), $sizeDisplay, $file.DirectoryName)
}

Write-Host ""
Write-Host "=" * 100
Write-Host "Users 폴더 내 하위 디렉토리 용량 분석" -ForegroundColor Green
Write-Host "=" * 100

$userFolders = Get-ChildItem 'C:\Users' -Directory -ErrorAction SilentlyContinue

foreach($folder in $userFolders) {
    try {
        $size = (Get-ChildItem $folder.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        $sizeGB = [math]::Round($size/1GB, 2)
        Write-Host "$($folder.Name): $sizeGB GB"
    } catch {
        Write-Host "$($folder.Name): Access Denied" -ForegroundColor Yellow
    }
}
