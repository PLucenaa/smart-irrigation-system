import { Droplets } from 'lucide-react';

/**
 * Componente Sidebar para navegação principal.
 */
export const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-primary-600 to-primary-800 text-white shadow-lg z-10">
      <div className="flex flex-col h-full">
        {/* Logo e Título */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-primary-700">
          <Droplets className="w-8 h-8 text-primary-200" />
          <div>
            <h1 className="text-xl font-bold">EcoFlow</h1>
            <p className="text-sm text-primary-200">Irrigation System</p>
          </div>
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            <li>
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-700 text-white font-medium hover:bg-primary-600 transition-colors"
              >
                <span>📊</span>
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-primary-200 hover:bg-primary-700 hover:text-white transition-colors"
              >
                <span>🌱</span>
                <span>Dispositivos</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-primary-200 hover:bg-primary-700 hover:text-white transition-colors"
              >
                <span>📈</span>
                <span>Histórico</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-primary-200 hover:bg-primary-700 hover:text-white transition-colors"
              >
                <span>⚙️</span>
                <span>Configurações</span>
              </a>
            </li>
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-primary-700">
          <p className="text-xs text-primary-300">
            Sistema de Irrigação de Precisão
          </p>
          <p className="text-xs text-primary-400 mt-1">
            v1.0.0
          </p>
        </div>
      </div>
    </aside>
  );
};

