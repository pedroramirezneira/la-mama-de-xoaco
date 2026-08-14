import { useEffect, useState, type FormEvent } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { auth } from './firebase'
import './App.css'

type Mode = 'login' | 'register'

const authErrors: Record<string, string> = {
  'auth/email-already-in-use': 'Ese email ya está registrado.',
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/invalid-email': 'El email no es válido.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
}

function getErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    return authErrors[error.code] ?? 'No se pudo completar la operación.'
  }

  return 'Ocurrió un error inesperado.'
}

function App() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setToken(currentUser ? await currentUser.getIdToken() : '')
      setLoading(false)
    })
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const credential =
        mode === 'login'
          ? await signInWithEmailAndPassword(auth, email, password)
          : await createUserWithEmailAndPassword(auth, email, password)

      setUser(credential.user)
      setToken(await credential.user.getIdToken())
      setPassword('')
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(token)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('No se pudo copiar el token.')
    }
  }

  async function handleLogout() {
    setError('')
    await signOut(auth)
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode)
    setError('')
  }

  if (loading && !user) {
    return <main className="page">Cargando...</main>
  }

  return (
    <main className="page">
      <section className="card">
        <header>
          <span className="eyebrow">Firebase Auth</span>
          <h1>Firebase Token</h1>
          <p>Generá un ID token para probar tu backend.</p>
        </header>

        {user ? (
          <div className="token-view">
            <p className="session">
              Sesión iniciada como <strong>{user.email}</strong>
            </p>
            <label htmlFor="token">ID Token</label>
            <textarea id="token" value={token} readOnly rows={9} />
            {error && <p className="error">{error}</p>}
            <button className="primary" type="button" onClick={handleCopy}>
              {copied ? 'Copiado' : 'Copiar token'}
            </button>
            <button className="secondary" type="button" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        ) : (
          <>
            <div className="tabs" aria-label="Tipo de acceso">
              <button
                className={mode === 'login' ? 'active' : ''}
                type="button"
                onClick={() => changeMode('login')}
              >
                Ingresar
              </button>
              <button
                className={mode === 'register' ? 'active' : ''}
                type="button"
                onClick={() => changeMode('register')}
              >
                Registrarse
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />

              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={6}
                required
              />

              {error && <p className="error">{error}</p>}
              <button className="primary" type="submit" disabled={loading}>
                {loading
                  ? 'Procesando...'
                  : mode === 'login'
                    ? 'Ingresar'
                    : 'Crear cuenta'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  )
}

export default App
