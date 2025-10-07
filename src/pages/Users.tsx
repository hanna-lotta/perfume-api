import { useEffect, useState } from "react"

const Users = () => {
  const [users, setUsers] = useState<{ Sk: string; username: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("http://localhost:1444/api/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error loading users:", err)
        setLoading(false)
      })
  }, [])

  if (loading) return <p className="loading">Loading users...</p>

  return (
    <div className="user-page">
      <h1>User Page</h1>
      {users.length === 0 ? (
        <p className="no-users">No users found</p>
      ) : (
        <table className="user-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Username</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i}>
                <td>{u.Sk}</td>
                <td>{u.username}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default Users


