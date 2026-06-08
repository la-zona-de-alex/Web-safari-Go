try {
  $reg = curl.exe -s -X POST -F "name=E2 Tester" -F "email=test_e2@example.com" -F "password=pass123" -F "role=passenger" http://localhost:4000/api/register
  Write-Output "REGISTER:"
  Write-Output $reg

  $login = Invoke-RestMethod -Uri 'http://localhost:4000/api/login' -Method Post -ContentType 'application/json' -Body (@{email='test_e2@example.com'; password='pass123'} | ConvertTo-Json)
  Write-Output "LOGIN:"
  $login | ConvertTo-Json -Depth 5 | Write-Output
  $token = $login.token
  if ($token) {
    $token | Out-File -FilePath test_token.txt -Encoding utf8
    $ride = Invoke-RestMethod -Uri 'http://localhost:4000/api/rides' -Method Post -ContentType 'application/json' -Headers @{ Authorization = "Bearer $token" } -Body (@{origin_address='Calle A'; dest_address='Calle B'; price=9.5} | ConvertTo-Json)
    Write-Output "RIDE:"
    $ride | ConvertTo-Json -Depth 5 | Write-Output
  } else {
    Write-Error "No token returned"
  }
} catch {
  Write-Error $_
  exit 1
}
