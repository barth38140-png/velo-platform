#!/bin/bash
# Vérification automatique de la cohérence des réparateurs dans la base velo_platform

psql -U postgres -d velo_platform -c "\timing on"
echo '--- Doublons de noms de réparateurs ---'
psql -U postgres -d velo_platform -c "SELECT name, COUNT(*) FROM users WHERE role = 'repairer' GROUP BY name HAVING COUNT(*) > 1;"
echo '--- Doublons de profils par user_id ---'
psql -U postgres -d velo_platform -c "SELECT user_id, COUNT(*) FROM repairer_profiles GROUP BY user_id HAVING COUNT(*) > 1;"
echo '--- Réparateurs sans profil associé ---'
psql -U postgres -d velo_platform -c "SELECT u.id, u.name FROM users u LEFT JOIN repairer_profiles rp ON u.id = rp.user_id WHERE u.role = 'repairer' AND rp.user_id IS NULL;"
echo '--- Profils orphelins (user_id inexistant) ---'
psql -U postgres -d velo_platform -c "SELECT user_id FROM repairer_profiles WHERE user_id NOT IN (SELECT id FROM users);"
echo '--- Vérification terminée ---'
