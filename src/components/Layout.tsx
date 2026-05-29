/* Layout Component - A component that wraps the main content of the app
   - Use this file to add a header, footer, or other elements that should be present on every page
   - This component is used in the App.tsx file to wrap the main content of the app */

import { Outlet, Link } from 'react-router-dom'
import { Notifications } from './Notifications'
import { useAuth } from '@/hooks/use-auth'

export default function Layout() {
  const { user, signOut } = useAuth()

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="font-black text-xl text-indigo-600 tracking-tight flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm">
                M
              </div>
              Moviment
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Notifications />
                <div className="h-6 w-px bg-slate-200 mx-2" />
                <button
                  onClick={signOut}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link
                to="/"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-slate-900 text-slate-300 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <p className="font-bold text-white mb-2">Moviment Health Ecosystem</p>
              <p className="text-sm text-slate-400">
                © {new Date().getFullYear()} Moviment. Todos os direitos reservados.
              </p>
            </div>
            <div className="text-sm text-slate-400 max-w-lg text-left md:text-right border-l md:border-l-0 md:border-r border-slate-700 pl-4 md:pl-0 md:pr-4">
              <strong className="text-white block mb-1">Privacidade & Conformidade LGPD</strong>
              Seus dados de saúde estão seguros, criptografados e anonimizados para os gestores.
              Nossa infraestrutura é hospedada na AWS via Skip Cloud, garantindo estrita aderência
              às diretrizes de residência de dados no Brasil.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
