import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search as SearchIcon, ArrowLeft } from 'lucide-react';

interface UserResult {
	id: string;
	username: string;
	course: string;
	interests: string;
	location: string;
}

interface EventResult {
	id: string;
	title: string;
	location: string;
	starts_at: string;
	organizer: string;
}

function Search() {
	const navigate = useNavigate();
	const [query, setQuery] = useState('');
	const [users, setUsers] = useState<UserResult[]>([]);
	const [events, setEvents] = useState<EventResult[]>([]);
	const [searched, setSearched] = useState(false);
	const [loading, setLoading] = useState(false);

	const token = localStorage.getItem('token');

	useEffect(() => {
		if (!token) {
			navigate('/login');
		}
	}, []);

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!query.trim()) return;
		setLoading(true);
		try {
			const res = await axios.get(
				`http://localhost:8000/search?q=${encodeURIComponent(query)}`,
				{ headers: { Authorization: `Bearer ${token}` } },
			);
			setUsers(res.data.users);
			setEvents(res.data.events);
			setSearched(true);
		} catch (err) {
			if (axios.isAxiosError(err) && err.response?.status === 401) {
				localStorage.removeItem('token');
				navigate('/login');
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-black text-white">
			<div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
				<button
					onClick={() => navigate('/')}
					className="text-black-500 font-bold text-lg"
				>
					csoc
				</button>
			</div>

			<div className="max-w-lg mx-auto px-6 py-8">
				<h1 className="text-3xl font-bold mb-8">Search</h1>

				<form
					onSubmit={handleSearch}
					className="flex gap-2 mb-10"
				>
					<input
						placeholder="Search people, courses, events..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="flex-1 bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-lg px-4 py-3 outline-none focus:border-green-500 transition"
					/>
					<button
						type="submit"
						className="bg-green-500 hover:bg-green-400 text-black font-semibold px-5 py-3 rounded-lg transition inline-flex items-center gap-2"
					>
						{loading ? (
							'...'
						) : (
							<>
								<SearchIcon className="w-4 h-4" />
								Search
							</>
						)}
					</button>
				</form>

				{searched && (
					<>
						<div className="mb-8">
							<h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
								People
							</h2>
							{users.length === 0 ? (
								<p className="text-gray-600 text-sm">
									No people found
								</p>
							) : (
								<div className="flex flex-col gap-3">
									{users.map((u) => (
										<div
											key={u.id}
											className="bg-gray-900 border border-gray-800 rounded-xl p-4"
										>
											<p className="text-white font-semibold mb-2">
												{u.username}
											</p>
											<div className="flex flex-col gap-1">
												{u.course && (
													<div className="flex gap-2 text-sm">
														<span className="text-gray-500">
															Studies
														</span>
														<span className="text-gray-300">
															{u.course}
														</span>
													</div>
												)}
												{u.interests && (
													<div className="flex gap-2 text-sm">
														<span className="text-gray-500">
															Into
														</span>
														<span className="text-gray-300">
															{u.interests}
														</span>
													</div>
												)}
												{u.location && (
													<div className="flex gap-2 text-sm">
														<span className="text-gray-500">
															Based in
														</span>
														<span className="text-gray-300">
															{u.location}
														</span>
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						<div>
							<h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
								Events
							</h2>
							{events.length === 0 ? (
								<p className="text-gray-600 text-sm">
									No events found
								</p>
							) : (
								<div className="flex flex-col gap-3">
									{events.map((e) => (
										<div
											key={e.id}
											className="bg-gray-900 border border-gray-800 rounded-xl p-4"
										>
											<p className="text-white font-semibold mb-2">
												{e.title}
											</p>
											<div className="flex flex-col gap-1">
												<div className="flex gap-2 text-sm">
													<span className="text-gray-500">
														When
													</span>
													<span className="text-gray-300">
														{new Date(
															e.starts_at,
														).toLocaleString()}
													</span>
												</div>
												{e.location && (
													<div className="flex gap-2 text-sm">
														<span className="text-gray-500">
															Where
														</span>
														<span className="text-gray-300">
															{e.location}
														</span>
													</div>
												)}
												<div className="flex gap-2 text-sm">
													<span className="text-gray-500">
														By
													</span>
													<span className="text-gray-300">
														{e.organizer}
													</span>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</>
				)}

				<button
					onClick={() => navigate('/')}
					className="mt-10 text-black-500 hover:text-white text-sm transition inline-flex items-center gap-1"
				>
					<ArrowLeft className="w-4 h-4" />
					Home
				</button>
			</div>
		</div>
	);
}

export default Search;
