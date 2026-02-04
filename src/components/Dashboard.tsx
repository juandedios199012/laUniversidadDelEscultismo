import { useUser } from '../context/UserContext';

export default function Dashboard() {
  const { user } = useUser();
  return (
    <div className="max-w-2xl mx-auto mt-12 p-8 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Bienvenido a la web Scout</h1>
      {user && <div className="mb-4">Usuario: <span className="font-mono">{user.email}</span></div>}
      <p>Accede a todas las funcionalidades del sistema.</p>
    </div>
  );
}
