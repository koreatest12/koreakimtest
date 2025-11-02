# C:\Users\kwonn 하위 폴더 용량 분석

Write-Host "C:\Users\kwonn 하위 폴더 용량 분석" -ForegroundColor Green
Write-Host "=" * 80

$userFolders = Get-ChildItem 'C:\Users\kwonn' -Directory -ErrorAction SilentlyContinue
$results = @()

foreach($folder in $userFolders) {
    try {
        $size = (Get-ChildItem $folder.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        if ($size -gt 0) {
            $sizeGB = [math]::Round($size/1GB, 2)
            $sizeMB = [math]::Round($size/1MB, 2)

            $results += [PSCustomObject]@{
                FolderName = $folder.Name
                SizeGB = $sizeGB
                SizeMB = $sizeMB
            }
        }
    } catch {
        # 접근 거부된 폴더는 무시
    }
}

$results | Sort-Object SizeGB -Descending |
    Select-Object FolderName, @{Name='Size';Expression={
        if ($_.SizeGB -ge 1) { "$($_.SizeGB) GB" }
        else { "$($_.SizeMB) MB" }
    }} | Format-Table -AutoSize

Write-Host ""
Write-Host "총 용량이 100MB 이상인 폴더만 표시" -ForegroundColor Yellow
$results | Where-Object { $_.SizeMB -ge 100 } |
    Sort-Object SizeGB -Descending |
    Select-Object FolderName, @{Name='Size';Expression={
        if ($_.SizeGB -ge 1) { "$($_.SizeGB) GB" }
        else { "$($_.SizeMB) MB" }
    }} | Format-Table -AutoSize
