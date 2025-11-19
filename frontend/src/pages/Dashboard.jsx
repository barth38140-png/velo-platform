import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { repairService, repairerService, locationService } from '../services/api';
import { ExploreRepairs } from './ExploreRepairs';
import { MyOffers } from './MyOffers';
import { OffersReceived } from './OffersReceived';
import { Profile } from './Profile';
import '../styles/Dashboard.css';

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(user?.role === 'repairer' ? 'explore' : 'repairs');
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bikeType: '',
    location: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      loadRepairs();
    }
  }, [user, navigate]);

  const loadRepairs = async () => {
    setLoading(true);
    try {
      const response = await repairService.getMyRepairs();
      setRepairs(response.data.repairs || []);
    } catch (err) {
      setError('Failed to load repairs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRepair = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await repairService.createRepair(
        formData.title,
        formData.description,
        formData.bikeType,
        48.8566,
        2.3522,
        formData.location
      );
      setFormData({ title: '', description: '', bikeType: '', location: '' });
      loadRepairs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create repair');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Velo Platform Dashboard</h1>
        <div className="user-info">
          <span>{user?.name} ({user?.role})</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        <nav className="dashboard-nav">
          {user?.role === 'client' ? (
            <>
              <button
                className={`nav-btn ${activeTab === 'repairs' ? 'active' : ''}`}
                onClick={() => setActiveTab('repairs')}
              >
                My Repairs
              </button>
              <button
                className={`nav-btn ${activeTab === 'create' ? 'active' : ''}`}
                onClick={() => setActiveTab('create')}
              >
                Create Repair
              </button>
              <button
                className={`nav-btn ${activeTab === 'offers' ? 'active' : ''}`}
                onClick={() => setActiveTab('offers')}
              >
                Offers Received
              </button>
            </>
          ) : (
            <>
              <button
                className={`nav-btn ${activeTab === 'explore' ? 'active' : ''}`}
                onClick={() => setActiveTab('explore')}
              >
                Explore Repairs
              </button>
              <button
                className={`nav-btn ${activeTab === 'my-offers' ? 'active' : ''}`}
                onClick={() => setActiveTab('my-offers')}
              >
                My Offers
              </button>
            </>
          )}
          <button
            className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
        </nav>

        <main className="dashboard-main">
          {error && <div className="error">{error}</div>}

          {activeTab === 'repairs' && (
            <div className="tab-content">
              <h2>My Repair Requests</h2>
              {loading ? (
                <p>Loading...</p>
              ) : repairs.length > 0 ? (
                <div className="repairs-list">
                  {repairs.map(repair => (
                    <div key={repair.id} className="repair-card">
                      <h3>{repair.title}</h3>
                      <p>{repair.description}</p>
                      <p><strong>Type:</strong> {repair.bike_type}</p>
                      <p><strong>Status:</strong> {repair.status}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No repair requests yet</p>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <div className="tab-content">
              <h2>Create Repair Request</h2>
              <form onSubmit={handleCreateRepair}>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    minLength="10"
                  />
                </div>
                <div className="form-group">
                  <label>Bike Type</label>
                  <input
                    type="text"
                    value={formData.bikeType}
                    onChange={(e) => setFormData({ ...formData, bikeType: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
                <button type="submit">Create Repair Request</button>
              </form>
            </div>
          )}

          {activeTab === 'offers' && (
            <div className="tab-content">
              <OffersReceived />
            </div>
          )}

          {activeTab === 'explore' && (
            <div className="tab-content">
              <ExploreRepairs />
            </div>
          )}

          {activeTab === 'my-offers' && (
            <div className="tab-content">
              <MyOffers />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="tab-content">
              <Profile />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
