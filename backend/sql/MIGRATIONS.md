# Database migrations

This project uses simple SQL migration files under `backend/sql/`.

If you see an error like:

  updateOfferStatus error: error: la colonne « assigned_repairer_id » de la relation « repair_requests » n'existe pas

then the `repair_requests` table in your database is missing the column `assigned_repairer_id`.

To fix it, run the provided migration:

- File: `backend/sql/patch_add_assigned_repairer_id.sql`

PowerShell (using `.env` values):

```powershell
# from repository root
cd .\backend
# Make sure .env contains DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME
$envContent = Get-Content .env | Where-Object { $_ -match '=' } | ForEach-Object { $_ }
$DB_HOST = ((Get-Content .env) -match 'DB_HOST=(.*)') | Out-Null; $DB_HOST = $Matches[1]
$DB_PORT = ((Get-Content .env) -match 'DB_PORT=(.*)') | Out-Null; $DB_PORT = $Matches[1]
$DB_USER = ((Get-Content .env) -match 'DB_USER=(.*)') | Out-Null; $DB_USER = $Matches[1]
$DB_PASSWORD = ((Get-Content .env) -match 'DB_PASSWORD=(.*)') | Out-Null; $DB_PASSWORD = $Matches[1]
$DB_NAME = ((Get-Content .env) -match 'DB_NAME=(.*)') | Out-Null; $DB_NAME = $Matches[1]

# Run the migration with psql (psql must be installed)
$env:PGPASSWORD = $DB_PASSWORD
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f .\sql\patch_add_assigned_repairer_id.sql
Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
```

Or run a single psql command manually:

```powershell
psql -h <DB_HOST> -p <DB_PORT> -U <DB_USER> -d <DB_NAME> -c "ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS assigned_repairer_id INTEGER REFERENCES users(id) ON DELETE SET NULL;"
```

After applying the migration:

1. Restart the backend server: `npm run dev` from `backend`.
2. Retry the Accept Offer flow in the UI.

If errors persist, capture the server console output and the HTTP response body for the PATCH `/api/repair-offers/:offerId/status` request and share them so I can dig deeper.
