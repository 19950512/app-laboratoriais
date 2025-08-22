export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-300">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mt-4">Página não encontrada</h2>
        <p className="text-gray-600 mt-2">A página que você está procurando não existe.</p>
        <a 
          href="/"
          className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Voltar ao início
        </a>
      </div>
    </div>
  );
}
