#!/bin/bash
# Vérification automatique des offres de réparateur dans la base velo_platform

psql -U postgres -d velo_platform -c "\timing on"
echo '--- Liste des réparateurs (id, nom) ---'
psql -U postgres -d velo_platform -c "SELECT id, name FROM users WHERE role = 'repairer' ORDER BY id;"
echo '--- Nombre d\'offres par réparateur ---'
psql -U postgres -d velo_platform -c "SELECT repairer_id, COUNT(*) AS nb_offres FROM repair_offers GROUP BY repairer_id ORDER BY nb_offres DESC;"
echo '--- Offres pour un réparateur précis (ex: id=42) ---'
psql -U postgres -d velo_platform -c "SELECT * FROM repair_offers WHERE repairer_id = 42;"
echo '--- Vérification terminée ---'
