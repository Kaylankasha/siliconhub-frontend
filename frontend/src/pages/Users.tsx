import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Users as UsersIcon, Plus, Shield, UserX, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const Users = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    }
  });

  const createUserMutation = useMutation({
    mutationFn: (data: any) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
      setShowModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error creating user');
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      api.put(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error updating user');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">Error loading users. Please try again.</p>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Users</h1>
          <p className="text-gray-500 mt-1">Manage system users and permissions</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users?.map((user: any) => (
          <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-full ${
                user.role === 'ADMIN' ? 'bg-purple-100' : 'bg-green-100'
              }`}>
                <UsersIcon className={`w-6 h-6 ${
                  user.role === 'ADMIN' ? 'text-purple-600' : 'text-green-600'
                }`} />
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <h3 className="font-semibold text-lg">{user.fullName}</h3>
            <p className="text-gray-600 text-sm">@{user.username}</p>
            <p className="text-gray-500 text-sm mt-2">{user.email}</p>
            <p className="text-gray-500 text-sm">{user.phone}</p>
            
            <div className="mt-4 pt-4 border-t flex gap-2">
              <button 
                onClick={() => {
                  setEditingUser(user);
                  setShowModal(true);
                }}
                className="flex-1 text-blue-600 border border-blue-600 py-1 rounded hover:bg-blue-50 transition"
              >
                Edit
              </button>
              <button className="flex-1 text-red-600 border border-red-600 py-1 rounded hover:bg-red-50 transition">
                {user.isActive ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const userData = {
                username: formData.get('username'),
                password: formData.get('password'),
                fullName: formData.get('fullName'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                role: formData.get('role')
              };
              
              if (editingUser) {
                updateUserMutation.mutate({ id: editingUser.id, data: userData });
              } else {
                createUserMutation.mutate(userData);
              }
            }}>
              <input 
                name="username" 
                defaultValue={editingUser?.username || ''}
                placeholder="Username" 
                className="w-full p-2 border rounded mb-3" 
                required 
              />
              {!editingUser && (
                <input 
                  name="password" 
                  type="password" 
                  placeholder="Password" 
                  className="w-full p-2 border rounded mb-3" 
                  required 
                />
              )}
              <input 
                name="fullName" 
                defaultValue={editingUser?.fullName || ''}
                placeholder="Full Name" 
                className="w-full p-2 border rounded mb-3" 
                required 
              />
              <input 
                name="email" 
                type="email" 
                defaultValue={editingUser?.email || ''}
                placeholder="Email" 
                className="w-full p-2 border rounded mb-3" 
                required 
              />
              <input 
                name="phone" 
                defaultValue={editingUser?.phone || ''}
                placeholder="Phone" 
                className="w-full p-2 border rounded mb-3" 
                required 
              />
              <select 
                name="role" 
                defaultValue={editingUser?.role || 'CASHIER'}
                className="w-full p-2 border rounded mb-3"
              >
                <option value="CASHIER">Cashier</option>
                <option value="ADMIN">Admin</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                  {editingUser ? 'Update' : 'Create'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                  }} 
                  className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;