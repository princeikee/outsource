import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import { settingsApi } from '../services/api'

export default function Settings({ auth, onAuthUpdate }) {
  const [settings, setSettings] = useState(null)
  const [profileForm, setProfileForm] = useState({ name: '' })
  const [companyForm, setCompanyForm] = useState({ email: '', name: '', officeLatitude: '', officeLongitude: '', officeRadiusMeters: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isLoading, setLoading] = useState(true)
  const [isSaving, setSaving] = useState(false)
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
        name: data.company.name || '',
        email: data.company.email || '',
        officeLatitude: data.company.officeLatitude || '',
        officeLongitude: data.company.officeLongitude || '',
        officeRadiusMeters: data.company.officeRadiusMeters || '',
      })
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    try {
      const updated = await settingsApi.updateProfile(auth.token, profileForm)
      setSettings((current) => ({ ...current, user: updated }))
      onAuthUpdate?.({ user: { ...auth.user, name: updated.name } })
      setNotice('Profile settings saved.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  async function saveCompany(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    try {
      const updated = await settingsApi.updateCompany(auth.token, companyForm)
      setSettings((current) => ({ ...current, company: updated }))
      onAuthUpdate?.({ user: { ...auth.user, company: { ...auth.user.company, name: updated.name, email: updated.email } } })
      setNotice('Company settings saved.')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
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

  if (isLoading) {
    return <div className="rounded-lg border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm">Loading settings...</div>
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary-50 p-3 text-primary-600">
            <Icon name="settings" className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Settings</h3>
            <p className="mt-1 text-sm text-gray-500">Manage your account and workspace preferences.</p>
          </div>
        </div>
      </section>

      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice>{notice}</Notice>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <form className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm" onSubmit={saveProfile}>
          <SectionTitle title="Account Profile" subtitle="These details identify you inside Taskflow ERP." />
          <div className="space-y-4">
            <Field label="Full Name" name="name" value={profileForm.name} onChange={(event) => setProfileForm({ name: event.target.value })} required />
            <ReadOnlyField label="Email" value={settings?.user?.email || 'Not set'} />
            <ReadOnlyField label="Role" value={settings?.user?.role || 'Not set'} />
          </div>
          <div className="mt-6 flex justify-end">
            <button type="submit" disabled={isSaving} className="min-h-11 rounded-lg bg-primary-600 px-5 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-70">
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

        <form className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm" onSubmit={saveCompany}>
          <SectionTitle title="Company Settings" subtitle={canEditCompany ? 'Update company identity used across this tenant.' : 'Company details are read only for your role.'} />
          <div className="space-y-4">
            <Field label="Company Name" name="name" value={companyForm.name} onChange={(event) => setCompanyForm((current) => ({ ...current, name: event.target.value }))} disabled={!canEditCompany} required />
            <Field label="Company Email" name="email" type="email" value={companyForm.email} onChange={(event) => setCompanyForm((current) => ({ ...current, email: event.target.value }))} disabled={!canEditCompany} placeholder="company@example.com" />
            <ReadOnlyField label="Company Status" value={settings?.company?.status || 'ACTIVE'} />
          </div>
          <div className="mt-6 border-t border-gray-100 pt-6">
            <SectionTitle title="Office Attendance Location" subtitle="Employees can clock in and out only inside this location radius." />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Latitude" name="officeLatitude" type="number" step="0.0000001" value={companyForm.officeLatitude} onChange={(event) => setCompanyForm((current) => ({ ...current, officeLatitude: event.target.value }))} disabled={!canEditCompany} placeholder="6.5243793" />
              <Field label="Longitude" name="officeLongitude" type="number" step="0.0000001" value={companyForm.officeLongitude} onChange={(event) => setCompanyForm((current) => ({ ...current, officeLongitude: event.target.value }))} disabled={!canEditCompany} placeholder="3.3792057" />
              <Field label="Radius (meters)" name="officeRadiusMeters" type="number" min="10" max="5000" value={companyForm.officeRadiusMeters} onChange={(event) => setCompanyForm((current) => ({ ...current, officeRadiusMeters: event.target.value }))} disabled={!canEditCompany} placeholder="100" />
            </div>
            {canEditCompany && (
              <button type="button" onClick={useCurrentLocation} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700">
                <Icon name="activity" className="h-4 w-4" />
                Use Current Location
              </button>
            )}
          </div>
          {canEditCompany && (
            <div className="mt-6 flex justify-end">
              <button type="submit" disabled={isSaving} className="min-h-11 rounded-lg bg-primary-600 px-5 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-70">
                {isSaving ? 'Saving...' : 'Save Company'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

function SectionTitle({ subtitle, title }) {
  return (
    <div className="mb-6">
      <h4 className="text-lg font-bold text-gray-900">{title}</h4>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
    </div>
  )
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-gray-700">{label}</span>
      <input {...props} className="min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
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

function Notice({ children, tone = 'success' }) {
  const className = tone === 'error' ? 'border-red-100 bg-red-50 text-red-700' : 'border-green-100 bg-green-50 text-green-700'
  return <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${className}`}>{children}</div>
}
