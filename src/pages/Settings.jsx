import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Edit2, Search, User, Key, Shield, Check, X, RotateCcw, Plus } from 'lucide-react';
/* deleted import */
import DataTable from '../components/DataTable';
import ModalForm from '../components/ModalForm';
import CustomDropdown from '../components/CustomDropdown';

const PAGE_OPTIONS = [
  { path: '/order-history', label: 'Order Management' },
  { path: '/metal-issue', label: 'Metal Issue' },
  { path: '/follow-up', label: 'Follow Up' },
  { path: '/qc1', label: 'QC1' },
  { path: '/ghat-jama', label: 'Ghat Jama' },
  { path: '/meena-inhouse', label: 'Meena Inhouse' },
  { path: '/meena-outside', label: 'Meena Outside' },
  { path: '/meena-submit', label: 'Meena Submit' },
  { path: '/polish-inhouse', label: 'Polish Inhouse' },
  { path: '/polish-outside', label: 'Polish Outside' },
  { path: '/polish-submit', label: 'Polish Submit' },
  { path: '/bangle-polish', label: 'Bangle Polish' },
  { path: '/e-polish', label: 'E-Polish' },
  { path: '/qc2', label: 'QC2' },
  { path: '/dispatch', label: 'Dispatch' },
  { path: '/receipt', label: 'Receipt' },
  { path: '/qc3', label: 'QC3' },
  { path: '/huid-label', label: 'Huid/Label' },
  { path: '/receive-in-stock', label: 'Receive In Stock' },
  { path: '/delivery', label: 'Delivery' },
  { path: '/master', label: 'Master' },
];

const getPageAccessText = (user) => {
  if (user.role === 'ADMIN') return 'All Pages';
  if (!user.accessPages || user.accessPages.length === 0) return 'All Pages';
  return user.accessPages
    .map(p => PAGE_OPTIONS.find(o => o.path === p)?.label || p)
    .join(', ');
};

export default function Settings() {
  const [users, setUsers] = useState(getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);

  // New User Form State
  const [newUser, setNewUser] = useState({
    id: '',
    name: '',
    password: '',
    role: 'USER',
    accessPages: [],
    weekOff: 'Sunday'
  });

  // User Edit State
  const [editingUser, setEditingUser] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const handleEditUser = (user) => {
    setEditingUser({
      ...user,
      accessPages: user.accessPages || [],
      weekOff: user.weekOff || 'Sunday'
    });
    setShowEditUserModal(true);
  };

  const handleSaveUser = (e) => {
    if (e) e.preventDefault();
    if (!editingUser.name.trim() || !editingUser.password.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    const updatedUsers = users.map(u => u.id === editingUser.id ? editingUser : u);
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    setShowEditUserModal(false);
    setEditingUser(null);
    toast.success('User updated successfully!');
  };

  const handleDeleteUser = (userId) => {
    if (confirm('Are you sure you want to delete this user?')) {
      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      saveUsers(updatedUsers);
      toast.success('User deleted!');
    }
  };

  const handleAddUserSubmit = (e) => {
    e.preventDefault();

    if (!newUser.id.trim() || !newUser.name.trim() || !newUser.password.trim()) {
      toast.error('All fields are required!');
      return;
    }

    // Check if ID already exists
    const idExists = users.some(u => u.id.toLowerCase() === newUser.id.trim().toLowerCase());
    if (idExists) {
      toast.error('A user with this User ID already exists!');
      return;
    }

    const updatedUsers = [...users, {
      id: newUser.id.trim(),
      name: newUser.name.trim(),
      password: newUser.password.trim(),
      role: newUser.role,
      accessPages: newUser.role === 'ADMIN' ? [] : (newUser.accessPages || []),
      weekOff: newUser.weekOff || 'Sunday'
    }];

    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    
    // Reset state
    setNewUser({
      id: '',
      name: '',
      password: '',
      role: 'USER',
      accessPages: [],
      weekOff: 'Sunday'
    });
    setShowAddUserModal(false);
    toast.success('New user added successfully!');
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          user.name.toLowerCase().includes(q) ||
          user.id.toLowerCase().includes(q) ||
          user.role.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tableHeaders = [
    "SN", "Name", "User ID", "Password", "Role", "Week Off", "Page Access", "Actions"
  ];

  const renderRow = (user, idx) => {
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
    
    return (
      <tr key={user.id} className="hover:bg-amber-50/30 transition-colors border-b border-gray-100">
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{globalIdx}</td>
        <td className="px-4 py-3 text-left text-xs font-semibold text-gray-900 whitespace-nowrap">{user.name}</td>
        <td className="px-4 py-3 text-center text-xs text-amber-600 font-mono whitespace-nowrap">{user.id}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-400 whitespace-nowrap">••••••••</td>
        <td className="px-4 py-3 text-center whitespace-nowrap">
          <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-black ${
            user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {user.role}
          </span>
        </td>
        <td className="px-4 py-3 text-center text-xs font-semibold text-gray-700 whitespace-nowrap">
          {user.weekOff || '-'}
        </td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 max-w-[200px] truncate" title={getPageAccessText(user)}>
          {getPageAccessText(user)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-center">
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => handleEditUser(user)}
              className="flex items-center gap-1 text-amber-600 hover:text-amber-800 transition text-[11px] font-bold"
            >
              <Edit2 size={12} /> Edit
            </button>
            <button
              onClick={() => handleDeleteUser(user.id)}
              className="flex items-center gap-1 text-red-600 hover:text-red-800 transition text-[11px]"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const renderCard = (user, idx) => {
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;

    return (
      <div key={user.id} className="bg-white rounded-xl border border-amber-50 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-amber-100">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
              {globalIdx}
            </span>
            <span className="text-xs font-bold text-gray-900 truncate max-w-[130px]">{user.name}</span>
          </div>
          <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase ${
            user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {user.role}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">User ID</span>
            <span className="text-amber-600 font-mono font-semibold">{user.id}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Week Off</span>
            <span className="text-gray-700 font-bold">{user.weekOff || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Password</span>
            <span className="text-gray-400 font-bold">••••••••</span>
          </div>
        </div>

        <div className="text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
          <span className="text-gray-400 block uppercase text-[8px] tracking-tight font-semibold">Page Access</span>
          <span className="text-gray-700 font-medium truncate block max-w-full" title={getPageAccessText(user)}>
            {getPageAccessText(user)}
          </span>
        </div>

        <div className="flex gap-2 pt-1.5">
          <button
            onClick={() => handleEditUser(user)}
            className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 hover:text-amber-800 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border border-amber-100"
          >
            <Edit2 size={12} /> Edit
          </button>
          <button
            onClick={() => handleDeleteUser(user.id)}
            className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border border-red-100"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-2 md:space-y-6 flex flex-col h-full min-h-0">
      
      {/* Header toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full px-2 sm:px-0">
        <div className="flex flex-col lg:flex-row w-full gap-2 lg:gap-3 items-center">
          <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-2.5 top-[9px] lg:top-[11px] text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg lg:rounded pl-8 pr-2 py-1.5 focus:outline-none focus:border-amber-500 text-xs md:text-sm h-[32px] md:h-[38px]"
              />
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center justify-center lg:hidden h-[32px] w-[32px] flex-shrink-0 shadow-sm transition"
              title="Add New User"
            >
              <Plus size={16} />
            </button>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg h-[32px] w-[32px] flex-shrink-0 shadow-sm active:scale-95"
                title="Reset search"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowAddUserModal(true)}
          className="hidden lg:flex bg-amber-600 hover:bg-amber-700 text-white rounded-lg items-center justify-center transition shadow-sm w-[38px] h-[38px] flex-shrink-0"
          title="Add New User"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Main Content Area using DataTable */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <DataTable
          headers={tableHeaders}
          data={paginatedUsers}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="800px"
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          totalResults={filteredUsers.length}
        />
      </div>

      {/* Add New User Modal */}
      <ModalForm
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        title="Add New User Account"
        onSubmit={handleAddUserSubmit}
        submitText="Add User"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Full Name *</label>
            <div className="relative">
              <User className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Enter full name"
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs h-[32px] md:h-[36px]"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">User ID *</label>
            <div className="relative">
              <User className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <input
                type="text"
                value={newUser.id}
                onChange={(e) => setNewUser({ ...newUser, id: e.target.value })}
                placeholder="Enter unique user ID (e.g. jsmith)"
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs h-[32px] md:h-[36px]"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Password *</label>
            <div className="relative">
              <Key className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Enter login password"
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs h-[32px] md:h-[36px]"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-semibold">Access Role *</label>
            <CustomDropdown
              options={[
                { value: 'USER', label: 'USER' },
                { value: 'ADMIN', label: 'ADMIN' }
              ]}
              value={newUser.role}
              onChange={(val) => setNewUser(prev => ({ ...prev, role: val }))}
              placeholder="Select Role"
              className="w-full"
              height="h-[34px]"
              rounded="rounded-lg"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-semibold">Week Off *</label>
            <CustomDropdown
              options={[
                { value: 'Sunday', label: 'Sunday' },
                { value: 'Monday', label: 'Monday' },
                { value: 'Tuesday', label: 'Tuesday' },
                { value: 'Wednesday', label: 'Wednesday' },
                { value: 'Thursday', label: 'Thursday' },
                { value: 'Friday', label: 'Friday' },
                { value: 'Saturday', label: 'Saturday' }
              ]}
              value={newUser.weekOff}
              onChange={(val) => setNewUser(prev => ({ ...prev, weekOff: val }))}
              placeholder="Select Week Off"
              className="w-full"
              height="h-[34px]"
              rounded="rounded-lg"
            />
          </div>

          {newUser.role === 'USER' && (
            <div className="space-y-1">
              <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-semibold">Page Access</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PAGE_OPTIONS.map((page) => {
                  const isChecked = newUser.accessPages?.includes(page.path);
                  return (
                    <label key={page.path} className="flex items-center gap-2 text-xs text-gray-700 hover:text-amber-700 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setNewUser(prev => {
                            const current = prev.accessPages || [];
                            const updated = checked 
                              ? [...current, page.path] 
                              : current.filter(p => p !== page.path);
                            return { ...prev, accessPages: updated };
                          });
                        }}
                        className="rounded text-amber-600 focus:ring-amber-500 border-gray-300 w-3.5 h-3.5"
                      />
                      <span>{page.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </ModalForm>

      {/* Edit User Modal */}
      <ModalForm
        isOpen={showEditUserModal}
        onClose={() => {
          setShowEditUserModal(false);
          setEditingUser(null);
        }}
        title="Edit User Account"
        onSubmit={handleSaveUser}
        submitText="Save Changes"
        maxWidth="max-w-md"
      >
        {editingUser && (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Full Name *</label>
              <div className="relative">
                <User className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs h-[32px] md:h-[36px]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-semibold">User ID</label>
              <div className="relative">
                <span className="w-full pl-3 pr-3 py-2 border border-gray-200 bg-gray-100 text-gray-500 rounded text-xs block font-mono h-[32px] md:h-[36px] content-center">
                  {editingUser.id}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight">Password *</label>
              <div className="relative">
                <Key className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
                <input
                  type="text"
                  value={editingUser.password}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  placeholder="Enter login password"
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs h-[32px] md:h-[36px]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-semibold">Access Role *</label>
              <CustomDropdown
                options={[
                  { value: 'USER', label: 'USER' },
                  { value: 'ADMIN', label: 'ADMIN' }
                ]}
                value={editingUser.role}
                onChange={(val) => setEditingUser(prev => ({ ...prev, role: val }))}
                placeholder="Select Role"
                className="w-full"
                height="h-[34px]"
                rounded="rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-semibold">Week Off *</label>
              <CustomDropdown
                options={[
                  { value: 'Sunday', label: 'Sunday' },
                  { value: 'Monday', label: 'Monday' },
                  { value: 'Tuesday', label: 'Tuesday' },
                  { value: 'Wednesday', label: 'Wednesday' },
                  { value: 'Thursday', label: 'Thursday' },
                  { value: 'Friday', label: 'Friday' },
                  { value: 'Saturday', label: 'Saturday' }
                ]}
                value={editingUser.weekOff}
                onChange={(val) => setEditingUser(prev => ({ ...prev, weekOff: val }))}
                placeholder="Select Week Off"
                className="w-full"
                height="h-[34px]"
                rounded="rounded-lg"
              />
            </div>

            {editingUser.role === 'USER' && (
              <div className="space-y-1">
                <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-semibold">Page Access</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PAGE_OPTIONS.map((page) => {
                    const isChecked = editingUser.accessPages?.includes(page.path);
                    return (
                      <label key={page.path} className="flex items-center gap-2 text-xs text-gray-700 hover:text-amber-700 cursor-pointer font-medium">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setEditingUser(prev => {
                              const current = prev.accessPages || [];
                              const updated = checked 
                                ? [...current, page.path] 
                                : current.filter(p => p !== page.path);
                              return { ...prev, accessPages: updated };
                            });
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500 border-gray-300 w-3.5 h-3.5"
                        />
                        <span>{page.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </ModalForm>

    </div>
  );
}
