Param(
  [Parameter(Mandatory=$true)]
  [string]$Secret
)

Write-Host "Setting MIGRATION_SECRET via wrangler..."

# Pass the secret to wrangler via pipeline
$Secret | npx wrangler secret put MIGRATION_SECRET

Write-Host "Done."
