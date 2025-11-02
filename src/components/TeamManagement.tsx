'use client';

import { useState, useEffect } from 'react';

interface TeamMember {
  name: string;
  email: string;
  role: string;
  phone: string;
}

const API_BASE = 'https://web-production-608ab4.up.railway.app';

export default function TeamManagement() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: '',
    phone: ''
  });

  const [editingMember, setEditingMember] = useState({
    name: '',
    email: '',
    role: '',
    phone: '',
    originalEmail: ''
  });

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Add timeout for Railway deployments
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${API_BASE}/admin/team`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setTeamMembers(data.team_members || []);
      } else {
        setError('Failed to load team members');
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError('Error loading team members');
        console.error('Error loading team members:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const addTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email || !newMember.role) {
      return;
    }

    try {
      setIsAdding(true);
      const response = await fetch(`${API_BASE}/admin/team/add?name=${encodeURIComponent(newMember.name)}&email=${encodeURIComponent(newMember.email)}&role=${encodeURIComponent(newMember.role)}&phone=${encodeURIComponent(newMember.phone)}`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadTeamMembers();
        setShowAddModal(false);
        setNewMember({ name: '', email: '', role: '', phone: '' });
      }
    } catch (err) {
      console.error('Error adding team member:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const editTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember.name || !editingMember.email || !editingMember.role) {
      return;
    }

    try {
      setIsEditing(true);
      
      // Since backend doesn't have an update endpoint, we'll remove the old member and add the updated one
      // First, remove the old team member (always remove to ensure clean update)
      try {
        const removeResponse = await fetch(`${API_BASE}/admin/team/remove/${encodeURIComponent(editingMember.originalEmail)}`, {
          method: 'DELETE'
        });
        
        // Try to parse response, but continue even if it fails
        try {
          const removeData = await removeResponse.json();
          // Log if there was an error, but continue anyway (member might not exist)
          if (!removeData.success && removeResponse.status !== 404) {
            console.warn('Warning: Could not remove old team member:', removeData.message || 'Unknown error');
          }
        } catch {
          // If response is not JSON or parse fails, continue anyway
        }
      } catch (err) {
        // If remove fails, log but continue - we'll still try to add the updated member
        console.warn('Warning: Error removing old team member, continuing with update:', err);
      }
      
      // Then add the updated team member
      const addResponse = await fetch(`${API_BASE}/admin/team/add?name=${encodeURIComponent(editingMember.name)}&email=${encodeURIComponent(editingMember.email)}&role=${encodeURIComponent(editingMember.role)}&phone=${encodeURIComponent(editingMember.phone)}`, {
        method: 'POST'
      });
      
      if (!addResponse.ok) {
        throw new Error(`HTTP error! status: ${addResponse.status}`);
      }
      
      const addData = await addResponse.json();
      
      if (addData.success) {
        await loadTeamMembers();
        setShowEditModal(false);
        setEditingMember({ name: '', email: '', role: '', phone: '', originalEmail: '' });
      }
    } catch (err) {
      console.error('Error updating team member:', err);
    } finally {
      setIsEditing(false);
    }
  };

  const removeTeamMember = async (email: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    try {
      setIsRemoving(email);
      const response = await fetch(`${API_BASE}/admin/team/remove/${email}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadTeamMembers();
      }
    } catch (err) {
      console.error('Error removing team member:', err);
    } finally {
      setIsRemoving(null);
    }
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember({
      name: member.name,
      email: member.email,
      role: member.role,
      phone: member.phone,
      originalEmail: member.email
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingMember({ name: '', email: '', role: '', phone: '', originalEmail: '' });
  };

  const openAddModal = () => {
    setShowAddModal(true);
    setNewMember({ name: '', email: '', role: '', phone: '' });
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewMember({ name: '', email: '', role: '', phone: '' });
  };

  return (
    <>
      <div style={{backgroundColor: '#1a2e26'}} className="border border-gray-600 rounded-xl p-8 mb-8 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Team Management</h3>
              <p className="text-gray-400 text-sm">Manage team members who receive consultation notifications</p>
            </div>
          </div>
          <button 
            onClick={openAddModal}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl text-sm transition-all duration-300 flex items-center shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Team Member
          </button>
        </div>


        {loading ? (
          <div className="bg-gradient-to-r from-gray-700 to-gray-600 text-white p-6 rounded-xl">
            <div className="flex items-center justify-center">
              <svg className="w-6 h-6 mr-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Loading team members...</span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="font-semibold">Error loading team members</h4>
                <p className="text-red-100 text-sm">{error}</p>
              </div>
            </div>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="bg-gradient-to-r from-gray-700 to-gray-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold">No team members configured</h4>
                <p className="text-gray-200 text-sm">Add team members to start receiving consultation notifications</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left text-white font-semibold py-3 px-4">Name</th>
                  <th className="text-left text-white font-semibold py-3 px-4">Email</th>
                  <th className="text-left text-white font-semibold py-3 px-4">Role</th>
                  <th className="text-left text-white font-semibold py-3 px-4">Phone</th>
                  <th className="text-left text-white font-semibold py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member, index) => (
                  <tr key={index} className="border-b border-gray-700 hover:bg-gray-800 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{member.name}</td>
                    <td className="py-3 px-4 text-gray-300">{member.email}</td>
                    <td className="py-3 px-4 text-gray-300">{member.role}</td>
                    <td className="py-3 px-4 text-gray-300">{member.phone || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(member)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors duration-300 flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => removeTeamMember(member.email)}
                          disabled={isRemoving === member.email}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors duration-300 disabled:opacity-50 flex items-center"
                        >
                          {isRemoving === member.email ? (
                            <>
                              <svg className="w-4 h-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Removing...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Remove
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Team Member Popup Form */}
      {showAddModal && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4" style={{backgroundColor: '#29473d'}}>
          <div style={{backgroundColor: '#1a2e26'}} className="border border-gray-600 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Popup Header */}
            <div className="rounded-t-2xl p-4" style={{backgroundColor: '#29473d'}}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 flex items-center justify-center mr-3">
                    <img 
                      src="/logo9.png" 
                      alt="Logo" 
                      className="w-10 h-10 object-contain rounded-lg"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Add Team Member</h2>
                    <p className="text-gray-300 text-xs mt-1">Add a new team member to receive consultation notifications</p>
                  </div>
                </div>
                <button 
                  onClick={closeAddModal}
                  className="text-white hover:text-gray-300 text-2xl font-bold transition-colors duration-300"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Popup Body */}
            <form onSubmit={addTeamMember} className="p-4 space-y-3">
              <div className="space-y-3">
                <div>
                  <label className="block text-white text-sm font-semibold mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newMember.name}
                    onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-300 hover:border-gray-500"
                    placeholder="Enter team member name"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-semibold mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-300 hover:border-gray-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-semibold mb-1">
                    Role *
                  </label>
                  <input
                    type="text"
                    value={newMember.role}
                    onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-300 hover:border-gray-500"
                    placeholder="Enter role (e.g., Sales Representative)"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-semibold mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={newMember.phone}
                    onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-300 hover:border-gray-500"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isAdding}
                  className="w-full px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  {isAdding ? (
                    <>
                      <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Adding...
                    </>
                  ) : (
                    'Add Team Member'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Member Popup Form */}
      {showEditModal && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4" style={{backgroundColor: '#29473d'}}>
          <div style={{backgroundColor: '#1a2e26'}} className="border border-gray-600 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Popup Header */}
            <div className="rounded-t-2xl p-4" style={{backgroundColor: '#29473d'}}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 flex items-center justify-center mr-3">
                    <img 
                      src="/logo9.png" 
                      alt="Logo" 
                      className="w-10 h-10 object-contain rounded-lg"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Edit Team Member</h2>
                    <p className="text-gray-300 text-xs mt-1">Update team member information</p>
                  </div>
                </div>
                <button 
                  onClick={closeEditModal}
                  className="text-white hover:text-gray-300 text-2xl font-bold transition-colors duration-300"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Popup Body */}
            <form onSubmit={editTeamMember} className="p-4 space-y-3">
              <div className="space-y-3">
                <div>
                  <label className="block text-white text-sm font-semibold mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editingMember.name}
                    onChange={(e) => setEditingMember(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 hover:border-gray-500"
                    placeholder="Enter team member name"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-semibold mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editingMember.email}
                    onChange={(e) => setEditingMember(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 hover:border-gray-500"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-semibold mb-1">
                    Role *
                  </label>
                  <input
                    type="text"
                    value={editingMember.role}
                    onChange={(e) => setEditingMember(prev => ({ ...prev, role: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 hover:border-gray-500"
                    placeholder="Enter role (e.g., Sales Representative)"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-semibold mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={editingMember.phone}
                    onChange={(e) => setEditingMember(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 hover:border-gray-500"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isEditing}
                  className="w-full px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  {isEditing ? (
                    <>
                      <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Updating...
                    </>
                  ) : (
                    'Update Team Member'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
}
