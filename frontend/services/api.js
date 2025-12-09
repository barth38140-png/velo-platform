// Service API pour les compétences partagées
import axios from 'axios';

const API_URL = '/api/skills';

/**
 * Récupère toutes les compétences partagées
 */
export async function fetchSkills() {
  const { data } = await axios.get(API_URL);
  return data.skills || [];
}

/**
 * Ajoute une compétence partagée (si nouvelle)
 */
export async function addSkill(name) {
  const { data } = await axios.post(API_URL, { name });
  return data.skill;
}
