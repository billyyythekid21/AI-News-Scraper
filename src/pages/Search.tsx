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
				`/search?q=${encodeURIComponent(query)}`,
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
		<div className="csoc-page">
			<header className="csoc-header">
				<button onClick={() => navigate('/')} className="csoc-brand">
					csoc
				</button>
			</header>

			<div className="max-w-lg mx-auto px-6 py-10">
				<h1 className="font-display text-4xl font-extrabold tracking-tight mb-8">
					Search
				</h1>

				<form onSubmit={handleSearch} className="flex gap-2 mb-10">
					<input
						placeholder="Search people, courses, events..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="csoc-input flex-1"
					/>
					<button
						type="submit"
						className="csoc-btn inline-flex items-center gap-2 shrink-0"
					>
						{loading ? (
							'…'
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
						<section className="mb-10">
							<h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--csoc-muted)] mb-4">
								People
							</h2>
							{users.length === 0 ? (
								<p className="text-sm text-[var(--csoc-muted)]">No people found</p>
							) : (
								<div className="divide-y divide-[var(--csoc-line)] border-y border-[var(--csoc-line)]">
									{users.map((u) => (
										<article key={u.id} className="py-4">
											<p className="font-semibold mb-2">{u.username}</p>
											<div className="flex flex-col gap-1 text-sm">
												{u.course && (
													<div className="flex gap-3">
														<span className="text-[var(--csoc-muted)] w-16">
															Studies
														</span>
														<span>{u.course}</span>
													</div>
												)}
												{u.interests && (
													<div className="flex gap-3">
														<span className="text-[var(--csoc-muted)] w-16">
															Into
														</span>
														<span>{u.interests}</span>
													</div>
												)}
												{u.location && (
													<div className="flex gap-3">
														<span className="text-[var(--csoc-muted)] w-16">
															Based in
														</span>
														<span>{u.location}</span>
													</div>
												)}
											</div>
										</article>
									))}
								</div>
							)}
						</section>

						<section>
							<h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--csoc-muted)] mb-4">
								Events
							</h2>
							{events.length === 0 ? (
								<p className="text-sm text-[var(--csoc-muted)]">No events found</p>
							) : (
								<div className="divide-y divide-[var(--csoc-line)] border-y border-[var(--csoc-line)]">
									{events.map((e) => (
										<article key={e.id} className="py-4">
											<p className="font-semibold mb-2">{e.title}</p>
											<div className="flex flex-col gap-1 text-sm">
												<div className="flex gap-3">
													<span className="text-[var(--csoc-muted)] w-14">When</span>
													<span>{new Date(e.starts_at).toLocaleString()}</span>
												</div>
												{e.location && (
													<div className="flex gap-3">
														<span className="text-[var(--csoc-muted)] w-14">
															Where
														</span>
														<span>{e.location}</span>
													</div>
												)}
												<div className="flex gap-3">
													<span className="text-[var(--csoc-muted)] w-14">By</span>
													<span>{e.organizer}</span>
												</div>
											</div>
										</article>
									))}
								</div>
							)}
						</section>
					</>
				)}

				<button
					onClick={() => navigate('/')}
					className="mt-10 csoc-btn-ghost inline-flex items-center gap-1 text-[var(--csoc-accent)]"
				>
					<ArrowLeft className="w-4 h-4" />
					Home
				</button>
			</div>
		</div>
	);
}

export default Search;
