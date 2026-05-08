import { useEffect, useState } from 'react';
import { getUsers, updateUserRole } from '../services/adminService';

import './Admin.css';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res?.data || []);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadUsers = async () => {
      await fetchUsers();
    };

    loadUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId);

    try {
      await updateUserRole(userId, newRole);
      await fetchUsers();
    } catch (err) {
      console.error('Error updating role:', err);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return <div className="loading">Duke ngarkuar...</div>;
  }

  return (
    <div className="admin-page">

      <h1 className="admin-title">
        Menaxhimi i përdoruesve (Admin)
      </h1>

      <div className="admin-box">

        <table className="admin-table">

          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Emri</th>
              <th>Roli</th>
              <th>Veprimi</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id}>

                <td>{user.id}</td>
                <td>{user.email}</td>
                <td>{user.full_name || '-'}</td>

                <td>
                  <span className={`role role-${user.role}`}>
                    {user.role}
                  </span>
                </td>

                <td>
                  <select
                    value={user.role}
                    onChange={(e) =>
                      handleRoleChange(user.id, e.target.value)
                    }
                    disabled={updating === user.id}
                    className="select"
                  >
                    <option value="operator">Operator</option>
                    <option value="detective">Hetues</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>

              </tr>
            ))}
          </tbody>

        </table>

      </div>
    </div>
  );
}