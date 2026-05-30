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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-linear-to-br from-primary-900 to-primary-600 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-lg">
        <div className="mb-8 text-center">
          <img src={taskflowLogo} alt="Taskflow ERP logo" className="mx-auto mb-4 h-20 w-20 rounded-2xl border border-white/30 object-cover shadow-lg" />
          <h1 className="text-3xl font-bold text-white">Taskflow ERP</h1>
          <p className="mt-2 text-white/70">
            {isRegister ? 'Create your company workspace' : 'Sign in to your company workspace'}
          </p>
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
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {appealNotice && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
              {appealNotice}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-white py-3 font-semibold text-primary-700 shadow-lg transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Please wait...' : isRegister ? 'Create Company' : 'Sign In'}
          </button>
        </form>

        {!isRegister && appealContext?.appealAllowed && (
          <form className="mt-5 rounded-xl border border-white/15 bg-white/10 p-4" onSubmit={handleAppealSubmit}>
            <div className="mb-3">
              <h2 className="text-sm font-bold text-white">Appeal company access restriction</h2>
              <p className="mt-1 text-xs leading-5 text-white/70">
                {appealContext.companyName ? `${appealContext.companyName} can send a message to platform support.` : 'Send a message to platform support.'}
              </p>
            </div>
            <input type="hidden" name="email" value={appealContext.email || ''} readOnly />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-white/80">Appeal message</span>
              <textarea
                required
                minLength={10}
                name="message"
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-white/20 px-4 py-3 text-sm text-white placeholder:text-white/50 transition focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
                placeholder="Explain why your company account should be reviewed or restored."
              />
            </label>
            <button
              type="submit"
              disabled={isLoading}
              className="mt-3 w-full rounded-lg bg-white py-3 text-sm font-bold text-primary-700 shadow-lg transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Submit Appeal
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-white/75">
          {isRegister ? (
            <>
              Already have a company account?{' '}
              <Link to="/login" className="font-semibold text-white hover:text-white/85">Sign in</Link>
            </>
          ) : (
            <>
              Creating a new company?{' '}
              <Link to="/register" className="font-semibold text-white hover:text-white/85">Register company</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function AuthField({ label, name, placeholder, type = 'text', minLength }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-white/80">{label}</span>
      <input
        required
        minLength={minLength}
        name={name}
        type={type}
        className="w-full rounded-lg border border-white/10 bg-white/20 px-4 py-3 text-white placeholder:text-white/50 transition focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
        placeholder={placeholder}
      />
    </label>
  )
}
