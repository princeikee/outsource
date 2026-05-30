import { KpiCard, SectionCard } from '../../components/Cards'
import Icon from '../../components/Icon'

export default function EmployeeDashboard() {
  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <KpiCard title="Today" value="Not clocked in" sub="Use attendance to start your day" icon="clock" colorClasses="bg-primary-50 text-primary-600" trend="Action" />
        <KpiCard title="Leave Requests" value="1 Pending" sub="Latest request awaiting approval" icon="umbrella" colorClasses="bg-amber-50 text-amber-600" trend="Open" />
        <KpiCard title="Payroll" value="Unpaid" sub="Current month salary status" icon="banknote" colorClasses="bg-emerald-50 text-emerald-600" trend="May" />
      </div>

      <SectionCard className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">Employee Workspace</h3>
          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">Staff Access</span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <QuickAction icon="calendar-check" title="Attendance" description="Clock in, clock out, and review history." />
          <QuickAction icon="umbrella" title="Leave Requests" description="Request leave and track approval status." />
          <QuickAction icon="banknote" title="Payslips" description="View salary records and payment status." />
          <QuickAction icon="user-check" title="Profile" description="Check your department and personal details." />
        </div>
      </SectionCard>
    </>
  )
}

function QuickAction({ description, icon, title }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
        <Icon name={icon} className="h-5 w-5" />
      </div>
      <h4 className="font-semibold text-gray-800">{title}</h4>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  )
}
