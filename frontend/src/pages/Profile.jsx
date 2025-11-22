import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService, repairerService } from '../services/api';
import '../styles/Profile.css';

export function Profile() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: ''
  });
  const [repairerProfile, setRepairerProfile] = useState({
    skills: '',
    bio: '',
    rating: 0,
    service_radius_km: 10,
    is_available: true
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await authService.getProfile();
      const userData = response.data.user;
      // If the profile returned by the API doesn't match the identity in context,
      // there's likely a stale/incorrect token in localStorage. Log out to avoid
      // showing another user's private data.
      if (user && userData && user.id !== userData.id) {
        console.error('Profile mismatch: context user id', user?.id, 'API user id', userData.id);
        // clear local session and force re-login
        logout();
        navigate('/login');
        return;
      }
      setProfile({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        role: userData.role || ''
      });

      // Load repairer profile if user is a repairer
      if (userData.role === 'repairer') {
        try {
          const repairerRes = await repairerService.getRepairerProfile(user.id);
          if (repairerRes.data.profile) {
            setRepairerProfile({
              skills: repairerRes.data.profile.skills || '',
              bio: repairerRes.data.profile.bio || '',
              rating: repairerRes.data.profile.rating || 0,
              service_radius_km: repairerRes.data.profile.service_radius_km || 10,
              is_available: repairerRes.data.profile.is_available !== false
            });
          }
        } catch (err) {
          // Repairer profile may not exist yet
          console.error('Failed to load repairer profile:', err);
        }
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleRepairerChange = (field, value) => {
    setRepairerProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setError('');
      setSuccess('');
      // Note: In a real app, you'd have an endpoint to update user profile
      // For now, this is a placeholder
      setSuccess('Profile would be updated here');
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save profile');
    }
  };

  const handleSaveRepairerProfile = async () => {
    try {
      setError('');
      setSuccess('');
      await repairerService.createProfile(
        repairerProfile.skills,
        repairerProfile.bio,
        repairerProfile.service_radius_km,
        repairerProfile.is_available
      );
      setSuccess('Repairer profile updated successfully!');
      setIsEditing(false);
      await loadProfile();
    } catch (err) {
      setError('Failed to save repairer profile');
    }
  };

  if (loading) {
    return <div className="profile"><div className="spinner"><div className="loader"></div> Chargement du profil...</div></div>;
  }

  return (
    <div className="profile">
      <h2>My Profile</h2>

      {error && <div className="error-toast">{error}</div>}
      {success && <div className="success-toast">{success}</div>}

      {/* User Profile Section */}
      <div className="profile-section">
        <h3>Account Information</h3>
        <div className="profile-field">
          <label>Name</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => handleProfileChange('name', e.target.value)}
            disabled={!isEditing}
          />
        </div>
        <div className="profile-field">
          <label>Email</label>
          <input
            type="email"
            value={profile.email}
            disabled
            title="Email cannot be changed"
          />
        </div>
        <div className="profile-field">
          <label>Phone</label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => handleProfileChange('phone', e.target.value)}
            disabled={!isEditing}
          />
        </div>
        <div className="profile-field">
          <label>Role</label>
          <input
            type="text"
            value={profile.role.toUpperCase()}
            disabled
            title="Role cannot be changed"
          />
        </div>
      </div>

      {/* Repairer Profile Section */}
      {profile.role === 'repairer' && (
        <div className="profile-section">
          <h3>Repairer Profile</h3>
          <div className="profile-field">
            <label>Skills</label>
            <textarea
              value={repairerProfile.skills}
              onChange={(e) => handleRepairerChange('skills', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g., Wheel repair, Chain replacement, Brake adjustment"
            />
          </div>
          <div className="profile-field">
            <label>Bio</label>
            <textarea
              value={repairerProfile.bio}
              onChange={(e) => handleRepairerChange('bio', e.target.value)}
              disabled={!isEditing}
              placeholder="Tell clients about your experience and services..."
            />
          </div>
          <div className="profile-field">
            <label>Service Radius (km)</label>
            <input
              type="number"
              value={repairerProfile.service_radius_km}
              onChange={(e) => handleRepairerChange('service_radius_km', parseInt(e.target.value))}
              disabled={!isEditing}
              min="1"
              max="100"
            />
          </div>
          <div className="profile-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={repairerProfile.is_available}
                onChange={(e) => handleRepairerChange('is_available', e.target.checked)}
                disabled={!isEditing}
              />
              Currently Available for Repairs
            </label>
          </div>
          <div className="profile-field">
            <label>Rating</label>
            <div className="rating-display">
              {'⭐'.repeat(Math.round(repairerProfile.rating))}
              <span className="rating-value">{repairerProfile.rating.toFixed(1)}/5</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="profile-actions">
        {!isEditing ? (
          <button
            className="btn-edit"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </button>
        ) : (
          <>
            <button
              className="btn-save"
              onClick={async () => {
                setSaving(true);
                try {
                  await handleSaveProfile();
                  if (profile.role === 'repairer') {
                    await handleSaveRepairerProfile();
                  }
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              className="btn-cancel"
              onClick={() => {
                setIsEditing(false);
                loadProfile();
              }}
              disabled={saving}
            >
              Annuler
            </button>
          </>
        )}
      </div>
    </div>
  );
}
