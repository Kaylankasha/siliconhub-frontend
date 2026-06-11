import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Handshake, CheckCircle, XCircle, Clock, Eye, Star, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const Partners = () => {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await api.get('/partners');
      setPartners(response.data);
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast.error('Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  const updatePartnerStatus = async (id: string, status: string) => {
    try {
      await api.put(`/partners/${id}/status`, { status });
      toast.success(`Partner ${status.toLowerCase()} successfully`);
      fetchPartners();
    } catch (error) {
      toast.error('Error updating partner status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'PENDING':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      case 'REJECTED':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{status}</span>;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Strategic Partners</h1>
        <p className="text-gray-500 mt-1">Manage partner applications and relationships</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm">Total Partners</p>
          <p className="text-2xl font-bold">{partners.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-gray-500 text-sm">Approved</p>
          <p className="text-2xl font-bold text-green-600">{partners.filter(p => p.status === 'APPROVED').length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-yellow-500">
          <p className="text-gray-500 text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{partners.filter(p => p.status === 'PENDING').length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
          <p className="text-gray-500 text-sm">Total Orders</p>
          <p className="text-2xl font-bold">{partners.reduce((sum, p) => sum + (p.totalOrders || 0), 0)}</p>
        </div>
      </div>

      {/* Partners Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business Type</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Discount Rate</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {partners.map((partner) => (
                <tr key={partner.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{partner.name}</div>
                    <div className="text-sm text-gray-500">Since {new Date(partner.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{partner.phone}</div>
                    <div className="text-sm text-gray-500">{partner.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{partner.businessType || 'N/A'}</td>
                  <td className="px-6 py-4 text-center">{getStatusBadge(partner.status)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-semibold text-blue-600">{partner.discountRate}%</span>
                  </td>
                  <td className="px-6 py-4 text-center">{partner.totalOrders || 0}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {partner.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => updatePartnerStatus(partner.id, 'APPROVED')}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updatePartnerStatus(partner.id, 'REJECTED')}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setSelectedPartner(partner)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {partners.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Handshake className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No partner applications yet</p>
            <p className="text-sm mt-1">Partners will appear here when they apply</p>
          </div>
        )}
      </div>

      {/* Partner Details Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Partner Details</h2>
              <button onClick={() => setSelectedPartner(null)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Business Name</label>
                <p className="font-medium">{selectedPartner.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Contact Person</label>
                <p className="font-medium">{selectedPartner.contactPerson || selectedPartner.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p>{selectedPartner.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Phone</label>
                <p>{selectedPartner.phone}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Business Type</label>
                <p>{selectedPartner.businessType || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(selectedPartner.status)}</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Discount Rate</label>
                <p className="font-semibold text-blue-600">{selectedPartner.discountRate}%</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Applied On</label>
                <p>{new Date(selectedPartner.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t flex gap-2">
              {selectedPartner.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => {
                      updatePartnerStatus(selectedPartner.id, 'APPROVED');
                      setSelectedPartner(null);
                    }}
                    className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                  >
                    Approve Partner
                  </button>
                  <button
                    onClick={() => {
                      updatePartnerStatus(selectedPartner.id, 'REJECTED');
                      setSelectedPartner(null);
                    }}
                    className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedPartner(null)}
                className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Partners;