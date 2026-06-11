import { Link } from 'react-router-dom'
import taskflowLogo from '../assets/taskflowimage.jpeg'

export default function AuthPage({
  error,
  isLoading,
  mode,
  onLogin,
  onRegister,
}) {
  const isRegister = mode === 'register'

  function handleSubmit(e) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    if (isRegister) {
      onRegister({
        companyName: form.get('companyName'),
        adminName: form.get('adminName'),
        email: form.get('email'),
        password: form.get('password'),
      })
    } else {
      onLogin({
        email: form.get('email'),
        password: form.get('password'),
      })
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-6 overflow-hidden">

      {/* background glow */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-200/40 blur-3xl rounded-full" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-indigo-200/30 blur-3xl rounded-full" />
      </div>

      <div className="relative w-full max-w-md">

        {/* HERO BRAND */}
        <div className="flex flex-col items-center text-center mb-10">

          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-150" />

            <img
              src={taskflowLogo}
              className="relative h-20 w-20 rounded-2xl shadow-xl border border-white"
              alt="TaskFlow"
            />
          </div>

          <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-900">
            TaskFlow EPR
          </h1>

        </div>

        {/* CARD */}
        <div className="backdrop-blur-xl bg-white/80 border border-slate-200 shadow-2xl rounded-3xl p-10">

          {/* HEADER */}
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              {isRegister ? 'Create your workspace' : 'Welcome back'}
            </h2>

            <p className="text-slate-500 mt-1 text-sm">
              {isRegister
                ? 'Start managing your company in seconds'
                : 'Sign in to continue to your dashboard'}
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {isRegister && (
              <>
                <Field label="Company Name" name="companyName" />
                <Field label="Admin Name" name="adminName" />
              </>
            )}

            <Field label="Email" name="email" type="email" />
            <Field label="Password" name="password" type="password" />

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              disabled={isLoading}
              className="w-full rounded-xl py-3 font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:shadow-xl transition active:scale-[0.98]"
            >
              {isLoading
                ? 'Signing in...'
                : isRegister
                ? 'Create workspace'
                : 'Sign in'}
            </button>
          </form>

          {/* FOOTER */}
          <div className="mt-6 text-center text-sm text-slate-500">
            {isRegister ? (
              <>
                Already have an account?{' '}
                <Link className="text-blue-600 font-medium" to="/login">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New to TaskFlow?{' '}
                <Link className="text-blue-600 font-medium" to="/register">
                  Create account
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

/* INPUT FIELD */
function Field({ label, name, type = 'text' }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">
        {label}
      </span>

      <input
        required
        name={name}
        type={type}
        className="
          mt-1 w-full rounded-xl
          border border-slate-200
          bg-white/70 backdrop-blur
          px-4 py-3
          text-slate-900
          placeholder:text-slate-400
          focus:outline-none
          focus:ring-2 focus:ring-blue-500
          focus:border-blue-400
          transition
        "
      />
    </label>
  )
}