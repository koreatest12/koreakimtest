# C:\ 드라이브의 폴더별 용량 분석

Write-Host "C:\ 드라이브 최상위 폴더 용량 분석" -ForegroundColor Green
Write-Host "=" * 60

$folders = Get-ChildItem 'C:\' -Directory -ErrorAction SilentlyContinue
$results = @()

foreach($folder in $folders) {
    try {
        Write-Host "분석 중: $($folder.Name)..." -NoNewline
        $size = (Get-ChildItem $folder.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        $sizeGB = [math]::Round($size/1GB, 2)
        $results += [PSCustomObject]@{
            FolderName = $folder.Name
            SizeGB = $sizeGB
        }
        Write-Host " 완료 ($sizeGB GB)" -ForegroundColor Cyan
    } catch {
        Write-Host " 접근 거부" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "용량별 정렬 결과:" -ForegroundColor Green
Write-Host "=" * 60
$results | Sort-Object SizeGB -Descending | Format-Table -AutoSize

Write-Host ""
Write-Host "상위 10개 대용량 파일 검색 중..." -ForegroundColor Green
Write-Host "=" * 60

Get-ChildItem 'C:\' -Recurse -File -ErrorAction SilentlyContinue |
    Sort-Object Length -Descending |
    Select-Object -First 10 |
    ForEach-Object {
        $sizeMB = [math]::Round($_.Length/1MB, 2)
        [PSCustomObject]@{
            FileName = $_.Name
            Path = $_.DirectoryName
            SizeMB = $sizeMB
        }
    } | Format-Table -AutoSize
