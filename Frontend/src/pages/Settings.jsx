import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon'
import { settingsApi } from '../services/api'

const currencies = ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR']
const timezones = ['Africa/Lagos', 'Africa/Accra', 'Africa/Nairobi', 'Africa/Johannesburg', 'Europe/London', 'America/New_York']

export default function Settings({ auth, onAuthUpdate }) {
  const [settings, setSettings] = useState(null)
  const [profileForm, setProfileForm] = useState({ name: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' })
  const [companyForm, setCompanyForm] = useState(defaultCompanyForm)
  const [platformForm, setPlatformForm] = useState(defaultPlatformForm)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isLoading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState('')
  const isSuperAdmin = auth?.user?.role === 'SUPER_ADMIN'
  const canEditCompany = auth?.user?.role === 'COMPANY_ADMIN' || auth?.user?.role === 'HR'

  useEffect(() => {
    loadSettings()
  }, [auth.token])

  async function loadSettings() {
    setLoading(true)
    setError('')

    try {
      const data = await settingsApi.get(auth.token)
      setSettings(data)
      setProfileForm({ name: data.user.name || '' })
      setCompanyForm({
        defaultCurrency: data.company.defaultCurrency || 'NGN',
        email: data.company.email || '',
        lateGraceMinutes: data.company.lateGraceMinutes ?? 0,
        name: data.company.name || '',
        officeLatitude: data.company.officeLatitude || '',
        officeLongitude: data.company.officeLongitude || '',
        officeRadiusMeters: data.company.officeRadiusMeters || '',
        timezone: data.company.timezone || 'Africa/Lagos',
        workStartTime: data.company.workStartTime || '09:00',
      })
      if (data.platform) {
        setPlatformForm({
          appealEmail: data.platform.appealEmail || '',
          appealsEnabled: data.platform.appealsEnabled ?? true,
          notifyOnAppeal: data.platform.notifyOnAppeal ?? true,
          notifyOnNewCompany: data.platform.notifyOnNewCompany ?? true,
          platformName: data.platform.platformName || 'Taskflow ERP',
          registrationEnabled: data.platform.registrationEnabled ?? true,
          requireCompanyApproval: data.platform.requireCompanyApproval ?? false,
          supportEmail: data.platform.supportEmail || '',
        })
      }
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile(event) {
    event.preventDefault()
    await runSave('profile', async () => {
      const updated = await settingsApi.updateProfile(auth.token, profileForm)
      setSettings((current) => ({ ...current, user: updated }))
      onAuthUpdate?.({ user: { ...auth.user, name: updated.name } })
      setNotice('Profile settings saved.')
    })
  }

  async function savePassword(event) {
    event.preventDefault()
    await runSave('password', async () => {
      await settingsApi.updatePassword(auth.token, passwordForm)
      setPasswordForm({ currentPassword: '', newPassword: '' })
      setNotice('Password updated successfully.')
    })
  }

  async function saveCompany(event) {
    event.preventDefault()
    await runSave('company', async () => {
      const updated = await settingsApi.updateCompany(auth.token, companyForm)
      setSettings((current) => ({ ...current, company: updated }))
      onAuthUpdate?.({ user: { ...auth.user, company: { ...auth.user.company, name: updated.name, email: updated.email } } })
      setNotice('Company settings saved.')
    })
  }

  async function savePlatform(event) {
    event.preventDefault()
    await runSave('platform', async () => {
      const updated = await settingsApi.updatePlatform(auth.token, platformForm)
      setSettings((current) => ({ ...current, platform: updated }))
      setNotice('Platform settings saved.')
    })
  }

  async function runSave(key, action) {
    setSavingKey(key)
    setError('')
    setNotice('')

    try {
      await action()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSavingKey('')
    }
  }

  async function useCurrentLocation() {
    setError('')
    setNotice('')

    if (!navigator.geolocation) {
      setError('Location is not supported by this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCompanyForm((current) => ({
          ...current,
          officeLatitude: position.coords.latitude.toFixed(7),
          officeLongitude: position.coords.longitude.toFixed(7),
          officeRadiusMeters: current.officeRadiusMeters || 100,
        }))
        setNotice('Office coordinates captured. Save company settings to apply them.')
      },
      () => setError('Could not get your current location. Allow location access and try again.'),
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  const settingSummary = useMemo(() => {
    if (isSuperAdmin) {
      return [
        { icon: 'shield-check', label: 'Account', value: settings?.user?.isActive ? 'Active' : 'Disabled' },
        { icon: 'user-check', label: 'Role', value: 'Super Admin' },
        { icon: 'building-2', label: 'Tenants', value: 'Managed separately' },
        { icon: 'settings', label: 'Scope', value: 'Platform access' },
      ]
    }

    const officeReady = companyForm.officeLatitude && companyForm.officeLongitude && companyForm.officeRadiusMeters
    return [
      { icon: 'shield-check', label: 'Account', value: settings?.user?.isActive ? 'Active' : 'Disabled' },
      { icon: 'building-2', label: 'Company', value: settings?.company?.status || 'ACTIVE' },
      { icon: 'calendar-check', label: 'Attendance', value: officeReady ? `${companyForm.officeRadiusMeters}m radius` : 'Not configured' },
      { icon: 'clock', label: 'Late Rule', value: `${companyForm.workStartTime} + ${companyForm.lateGraceMinutes || 0}m` },
    ]
  }, [companyForm, isSuperAdmin, settings])

  if (isLoading) {
    return <div className="rounded-lg border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">Loading settings...</div>
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
        <div className="relative overflow-hidden bg-sidebar px-6 py-8 text-white sm:px-8">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-primary-400" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <h3 className="text-3xl font-black tracking-tight sm:text-4xl">Settings</h3>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-px bg-slate-100 p-2 md:grid-cols-4">
          {settingSummary.map((item) => <SummaryTile key={item.label} item={item} />)}
        </div>
      </section>

      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice>{notice}</Notice>}

      <div className={isSuperAdmin ? 'grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]' : 'grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]'}>
        <div className="space-y-6">
          <form className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm" onSubmit={saveProfile}>
            <SectionTitle icon="user-check" title="Account Profile" subtitle={isSuperAdmin ? 'Personal details used for your platform administrator account.' : 'Personal details used across your ERP workspace.'} />
            <div className="space-y-4">
              <Field label="Full Name" name="name" value={profileForm.name} onChange={(event) => setProfileForm({ name: event.target.value })} required />
              <ReadOnlyField label="Email" value={settings?.user?.email || 'Not set'} />
              <ReadOnlyField label="Role" value={settings?.user?.role || 'Not set'} />
            </div>
            <ActionRow>
              <PrimaryButton disabled={savingKey === 'profile'}>{savingKey === 'profile' ? 'Saving...' : 'Save Profile'}</PrimaryButton>
            </ActionRow>
          </form>

          <form className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm" onSubmit={savePassword}>
            <SectionTitle icon="shield-check" title="Security" subtitle={isSuperAdmin ? 'Change the password for your platform administrator sign-in.' : 'Change your password without affecting other company users.'} />
            <div className="space-y-4">
              <Field label="Current Password" type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} required />
              <Field label="New Password" type="password" minLength="8" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} required />
            </div>
            <ActionRow>
              <PrimaryButton disabled={savingKey === 'password'}>{savingKey === 'password' ? 'Updating...' : 'Update Password'}</PrimaryButton>
            </ActionRow>
          </form>
        </div>

        {isSuperAdmin ? (
          <form className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm" onSubmit={savePlatform}>
            <SectionTitle icon="settings" title="Platform Settings" subtitle="Control registration, default tenant rules, appeals, and platform contact details." />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Platform Name" value={platformForm.platformName} onChange={(event) => updatePlatformField('platformName', event.target.value, setPlatformForm)} required />
              <Field label="Support Email" type="email" value={platformForm.supportEmail} onChange={(event) => updatePlatformField('supportEmail', event.target.value, setPlatformForm)} placeholder="support@example.com" />
            </div>

            <Divider />

            <SectionTitle compact icon="building-2" title="Registration Controls" subtitle="Decide how new companies enter the platform." />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ToggleField label="Allow Company Registration" checked={platformForm.registrationEnabled} onChange={(event) => updatePlatformField('registrationEnabled', event.target.checked, setPlatformForm)} />
              <ToggleField label="Require Super Admin Approval" checked={platformForm.requireCompanyApproval} onChange={(event) => updatePlatformField('requireCompanyApproval', event.target.checked, setPlatformForm)} />
            </div>

            <Divider />

            <SectionTitle compact icon="shield-check" title="Appeals & Alerts" subtitle="Control appeal intake and platform notification preferences." />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ToggleField label="Allow Company Appeals" checked={platformForm.appealsEnabled} onChange={(event) => updatePlatformField('appealsEnabled', event.target.checked, setPlatformForm)} />
              <Field label="Appeal Email" type="email" value={platformForm.appealEmail} onChange={(event) => updatePlatformField('appealEmail', event.target.value, setPlatformForm)} placeholder="appeals@example.com" />
              <ToggleField label="Notify on New Company" checked={platformForm.notifyOnNewCompany} onChange={(event) => updatePlatformField('notifyOnNewCompany', event.target.checked, setPlatformForm)} />
              <ToggleField label="Notify on Appeal" checked={platformForm.notifyOnAppeal} onChange={(event) => updatePlatformField('notifyOnAppeal', event.target.checked, setPlatformForm)} />
            </div>

            <ActionRow>
              <PrimaryButton disabled={savingKey === 'platform'}>{savingKey === 'platform' ? 'Saving...' : 'Save Platform Settings'}</PrimaryButton>
            </ActionRow>
          </form>
        ) : (
        <form className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm" onSubmit={saveCompany}>
          <SectionTitle icon="building-2" title="Company Workspace" subtitle={canEditCompany ? 'Set company identity, business defaults, and attendance rules.' : 'Company details are read only for your role.'} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Company Name" name="name" value={companyForm.name} onChange={(event) => updateCompanyField('name', event.target.value, setCompanyForm)} disabled={!canEditCompany} required />
            <Field label="Company Email" name="email" type="email" value={companyForm.email} onChange={(event) => updateCompanyField('email', event.target.value, setCompanyForm)} disabled={!canEditCompany} placeholder="company@example.com" />
            <Select label="Default Currency" value={companyForm.defaultCurrency} onChange={(event) => updateCompanyField('defaultCurrency', event.target.value, setCompanyForm)} disabled={!canEditCompany}>
              {currencies.map((currency) => <option key={currency}>{currency}</option>)}
            </Select>
            <Select label="Timezone" value={companyForm.timezone} onChange={(event) => updateCompanyField('timezone', event.target.value, setCompanyForm)} disabled={!canEditCompany}>
              {timezones.map((timezone) => <option key={timezone}>{timezone}</option>)}
            </Select>
          </div>

          <Divider />

          <SectionTitle compact icon="clock" title="Attendance Policy" subtitle="This controls location clock-in and late-arrival calculations." />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Work Start Time" name="workStartTime" type="time" value={companyForm.workStartTime} onChange={(event) => updateCompanyField('workStartTime', event.target.value, setCompanyForm)} disabled={!canEditCompany} />
            <Field label="Grace Minutes" name="lateGraceMinutes" type="number" min="0" max="120" value={companyForm.lateGraceMinutes} onChange={(event) => updateCompanyField('lateGraceMinutes', event.target.value, setCompanyForm)} disabled={!canEditCompany} />
          </div>

          <Divider />

          <SectionTitle compact icon="calendar-check" title="Office Attendance Location" subtitle="Employees can clock in and out only inside this office radius." />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Latitude" name="officeLatitude" type="number" step="0.0000001" value={companyForm.officeLatitude} onChange={(event) => updateCompanyField('officeLatitude', event.target.value, setCompanyForm)} disabled={!canEditCompany} placeholder="6.5243793" />
            <Field label="Longitude" name="officeLongitude" type="number" step="0.0000001" value={companyForm.officeLongitude} onChange={(event) => updateCompanyField('officeLongitude', event.target.value, setCompanyForm)} disabled={!canEditCompany} placeholder="3.3792057" />
            <Field label="Radius (meters)" name="officeRadiusMeters" type="number" min="10" max="5000" value={companyForm.officeRadiusMeters} onChange={(event) => updateCompanyField('officeRadiusMeters', event.target.value, setCompanyForm)} disabled={!canEditCompany} placeholder="100" />
          </div>
          {canEditCompany && (
            <button type="button" onClick={useCurrentLocation} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700">
              <Icon name="activity" className="h-4 w-4" />
              Use Current Location
            </button>
          )}

          <Divider />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ReadOnlyField label="Company Status" value={settings?.company?.status || 'ACTIVE'} />
            <ReadOnlyField label="Workspace ID" value={settings?.company?.id || 'Not set'} />
          </div>

          {canEditCompany && (
            <ActionRow>
              <PrimaryButton disabled={savingKey === 'company'}>{savingKey === 'company' ? 'Saving...' : 'Save Workspace Settings'}</PrimaryButton>
            </ActionRow>
          )}
        </form>
        )}
      </div>
    </div>
  )
}

const defaultCompanyForm = {
  defaultCurrency: 'NGN',
  email: '',
  lateGraceMinutes: 0,
  name: '',
  officeLatitude: '',
  officeLongitude: '',
  officeRadiusMeters: '',
  timezone: 'Africa/Lagos',
  workStartTime: '09:00',
}

const defaultPlatformForm = {
  appealEmail: '',
  appealsEnabled: true,
  notifyOnAppeal: true,
  notifyOnNewCompany: true,
  platformName: 'Taskflow ERP',
  registrationEnabled: true,
  requireCompanyApproval: false,
  supportEmail: '',
}

function updateCompanyField(name, value, setCompanyForm) {
  setCompanyForm((current) => ({ ...current, [name]: value }))
}

function updatePlatformField(name, value, setPlatformForm) {
  setPlatformForm((current) => ({ ...current, [name]: value }))
}

function SummaryTile({ item }) {
  return (
    <div className="flex min-h-24 items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm">
      <div className="rounded-xl bg-slate-100 p-2.5 text-sidebar">
        <Icon name={item.icon} className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{item.label}</p>
        <p className="mt-1 text-sm font-black text-slate-900">{item.value}</p>
      </div>
    </div>
  )
}

function SectionTitle({ compact = false, icon, subtitle, title }) {
  return (
    <div className={compact ? 'mb-4' : 'mb-6'}>
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary-50 p-2 text-primary-600">
          <Icon name={icon} className="h-5 w-5" />
        </div>
        <h4 className="text-lg font-bold text-gray-900">{title}</h4>
      </div>
      <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
    </div>
  )
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-gray-700">{label}</span>
      <input {...props} className="min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 transition disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
    </label>
  )
}

function Select({ children, label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-gray-700">{label}</span>
      <select {...props} className="min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 transition disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500">
        {children}
      </select>
    </label>
  )
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
      <p className="mt-1 break-words font-medium text-gray-900">{value}</p>
    </div>
  )
}

function ToggleField({ checked, label, onChange }) {
  return (
    <label className="flex min-h-16 items-center justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
      <span className="text-sm font-semibold text-gray-800">{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
    </label>
  )
}

function ActionRow({ children }) {
  return <div className="mt-6 flex justify-end">{children}</div>
}

function PrimaryButton({ children, disabled }) {
  return (
    <button type="submit" disabled={disabled} className="min-h-11 rounded-lg bg-primary-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70">
      {children}
    </button>
  )
}

function Divider() {
  return <div className="my-6 border-t border-gray-100" />
}

function Notice({ children, tone = 'success' }) {
  const className = tone === 'error' ? 'border-red-100 bg-red-50 text-red-700' : 'border-green-100 bg-green-50 text-green-700'
  return <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${className}`}>{children}</div>
}
