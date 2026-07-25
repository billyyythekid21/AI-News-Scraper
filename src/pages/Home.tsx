import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, Heart, Calendar, Search } from 'lucide-react';
import { subscribeToPush } from '../api/push';

interface User {
	username: string;
	email: string;
	course: string | null;
	bio: string | null;
}

function Home() {
	const navigate = useNavigate();
	const [user, setUser] = useState<User | null>(null);

	const token = localStorage.getItem('token');

	useEffect(() => {
		if (!token) {
			navigate('/login');
			return;
		}
		axios
			.get('http://localhost:8000/me', {
				headers: { Authorization: `Bearer ${token}` },
			})
			.then((res) => {
				setUser(res.data);
				subscribeToPush(token).catch(() => {});
			})
			.catch(() => {
				localStorage.removeItem('token');
				navigate('/login');
			});
	}, []);

	const logout = () => {
		localStorage.removeItem('token');
		navigate('/login');
	};

	if (!user) return <div>Loading...</div>;

	return (
		<div className="min-h-screen bg-black text-white">
			{/* Header */}
			<div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
				<span className="text-green-500 font-bold text-lg">csoc</span>
				<button
					onClick={logout}
					className="text-black hover:text-red-400 text-sm transition"
				>
					Log out
				</button>
			</div>

			{/* Main */}
			<div className="max-w-lg mx-auto px-6 py-12">
				{/* Greeting */}
				<div className="mb-10">
					<h1 className="text-3xl font-bold text-white">
						Hi, {user.username}!
					</h1>
					{user.course && (
						<p className="text-gray-500 mt-1">{user.course}</p>
					)}
				</div>

				{/* Actions */}
				<div className="grid grid-cols-2 gap-4 mb-4">
					<button
						onClick={() => navigate('/match')}
						className="bg-green-500 hover:bg-green-400 text-black font-semibold rounded-xl p-5 text-left transition"
					>
						<Users className="w-6 h-6 mb-2" />
						<div>Find People</div>
					</button>
					<button
						onClick={() => navigate('/matches')}
						className="bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-semibold rounded-xl p-5 text-left transition"
					>
						<Heart className="w-6 h-6 mb-2" />
						<div>Your Matches</div>
					</button>
					<button
						onClick={() => navigate('/events')}
						className="bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-semibold rounded-xl p-5 text-left transition"
					>
						<Calendar className="w-6 h-6 mb-2" />
						<div>Events</div>
					</button>
					<button
						onClick={() => navigate('/search')}
						className="bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-semibold rounded-xl p-5 text-left transition"
					>
						<Search className="w-6 h-6 mb-2" />
						<div>Search</div>
					</button>
				</div>

				{/* Edit Profile */}
				<button
					onClick={() => navigate('/profile')}
					className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white font-semibold rounded-xl p-4 text-left transition flex items-center justify-between"
				>
					<span>Edit Profile</span>
					<span className="text-gray-500">→</span>
				</button>
			</div>
		</div>
	);
}

export default Home;
