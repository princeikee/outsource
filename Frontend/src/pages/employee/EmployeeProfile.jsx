export default function EmployeeProfile({ user }) {
  const details = [
    ['Name', user?.name || 'Employee User'],
    ['Email', user?.email || 'employee@company.com'],
    ['Role', user?.role || 'staff'],
    ['Company ID', user?.companyId || 'Assigned after login'],
    ['Department', 'Operations'],
    ['Job Title', 'Team Member'],
  ]

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-6 text-lg font-bold text-gray-800">My Profile</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {details.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
            <p className="mt-1 font-medium text-gray-900">{value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
