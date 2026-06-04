import { Link } from 'react-router-dom'
import taskflowLogo from '../assets/taskflowimage.jpeg'

export default function AuthPage({ appealContext, appealNotice, error, isLoading, mode, onAppeal, onLogin, onRegister }) {
  const isRegister = mode === 'register'

  function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    if (isRegister) {
      onRegister({
        companyName: form.get('companyName'),
        adminName: form.get('adminName'),
        adminEmail: form.get('email'),
        password: form.get('password'),
      })
      return
    }

    onLogin({
      email: form.get('email'),
      password: form.get('password'),
    })
  }

  function handleAppealSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onAppeal({
      companyId: appealContext?.companyId,
      email: appealContext?.email || form.get('email'),
      message: form.get('message'),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-sidebar p-3 text-slate-900 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(30,41,59,0.98),_rgba(51,65,85,0.94)_38%,_rgba(255,255,255,0.96)_38%)] lg:bg-[linear-gradient(135deg,_rgba(30,41,59,0.98),_rgba(51,65,85,0.94)_48%,_rgba(255,255,255,0.96)_48%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.075)_1px,_transparent_1px),linear-gradient(90deg,_rgba(255,255,255,0.075)_1px,_transparent_1px)] bg-[size:42px_42px]" />

      <div className="relative my-3 grid w-full max-w-md overflow-hidden rounded-2xl border border-white/30 bg-white/95 shadow-2xl shadow-slate-950/25 backdrop-blur-xl sm:my-0 lg:min-h-[640px] lg:max-w-6xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative flex min-h-52 items-center justify-center bg-sidebar p-6 sm:min-h-64 sm:p-8 lg:min-h-full lg:p-12">
          <div className="absolute inset-x-0 bottom-0 h-32 bg-white/10" />
          <div className="relative text-center">
            <img src={taskflowLogo} alt="Taskflow ERP logo" className="mx-auto h-20 w-20 rounded-full border-4 border-white/30 bg-white object-cover shadow-2xl shadow-slate-950/25 sm:h-28 sm:w-28 lg:h-32 lg:w-32" />
            <h1 className="mt-4 text-3xl font-semibold text-white sm:mt-6 sm:text-4xl lg:text-5xl">Taskflow ERP</h1>
          </div>
        </div>

        <div className="flex items-center justify-center bg-white p-5 sm:p-8 lg:p-10">
          <div className="w-full max-w-md">
            <div className="mb-6 sm:mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-700">Account access</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950 sm:mt-3 sm:text-3xl">{isRegister ? 'Create workspace' : 'Welcome back'}</h3>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {isRegister && (
                <>
                  <AuthField name="companyName" label="Company Name" placeholder="Acme Corp" />
                  <AuthField name="adminName" label="Admin Name" placeholder="Jane Smith" />
                </>
              )}

              <AuthField name="email" label={isRegister ? 'Admin Email' : 'Email Address'} placeholder="you@company.com" type="email" />
              <AuthField name="password" label="Password" placeholder="Password" type="password" minLength={isRegister ? 8 : undefined} />

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              {appealNotice && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {appealNotice}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-sidebar px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-sidebar-hover disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? 'Please wait...' : isRegister ? 'Create company' : 'Sign in'}
              </button>
            </form>

            {!isRegister && appealContext?.appealAllowed && (
              <form className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5" onSubmit={handleAppealSubmit}>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-950">Appeal restricted access</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {appealContext.companyName ? `${appealContext.companyName} can contact platform support.` : 'Send a support message to restore access.'}
                  </p>
                </div>
                <input type="hidden" name="email" value={appealContext.email || ''} readOnly />
                <label className="block text-sm text-slate-700">
                  <span className="mb-2 block font-medium text-slate-700">Appeal message</span>
                  <textarea
                    required
                    minLength={10}
                    name="message"
                    rows={4}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    placeholder="Explain why your company account should be reviewed or restored."
                  />
                </label>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-sidebar transition hover:border-primary-300 hover:bg-slate-50"
                >
                  Submit appeal
                </button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-slate-500 sm:text-left">
              {isRegister ? (
                <>
                  Already have a company account?{' '}
                  <Link to="/login" className="font-semibold text-sidebar hover:text-primary-700">Sign in</Link>
                </>
              ) : (
                <>
                  Need a new workspace?{' '}
                  <Link to="/register" className="font-semibold text-sidebar hover:text-primary-700">Register company</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AuthField({ label, name, placeholder, type = 'text', minLength }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        required
        minLength={minLength}
        name={name}
        type={type}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-950 shadow-sm placeholder:text-slate-400 transition focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
        placeholder={placeholder}
      />
    </label>
  )
}
