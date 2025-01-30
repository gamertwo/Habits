export default function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
      <div className="flex justify-around p-4">
        <a href="/" className="text-gray-400 hover:text-white">
          Home
        </a>
        <a href="/create" className="text-gray-400 hover:text-white">
          Create
        </a>
        <a href="/grid" className="text-gray-400 hover:text-white">
          Grid
        </a>
      </div>
    </nav>
  );
}
