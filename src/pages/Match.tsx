import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Heart, X, ArrowLeft, Code2 } from 'lucide-react';

interface MatchUser {
	id: string;
	username: string;
	bio: string;
	course: string;
	interests: string;
	location: string;
	contact: string;
	github_username: string;
}

function Match() {
	const navigate = useNavigate();
	const [matches, setMatches] = useState<MatchUser[]>([]);
	const [index, setIndex] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [courseFilter, setCourseFilter] = useState('');
	const [appliedFilter, setAppliedFilter] = useState('');

	const token = localStorage.getItem('token');

	useEffect(() => {
		if (!token) {
			navigate('/login');
			return;
		}

		axios
			.get('/matches', {
				headers: { Authorization: `Bearer ${token}` },
			})
			.then((res) => {
				setMatches(res.data);
				setLoading(false);
			})
			.catch((err) => {
				if (err.response?.status === 400) {
					setError('Complete your profile first');
				} else {
					setError('Something went wrong');
				}
				setLoading(false);
			});
	}, []);

	const applyFilter = () => {
		setAppliedFilter(courseFilter);
		setIndex(0);
		setLoading(true);
		const url = courseFilter
			? `/matches?course=${encodeURIComponent(courseFilter)}`
			: '/matches';
		axios
			.get(url, {
				headers: { Authorization: `Bearer ${token}` },
			})
			.then((res) => {
				setMatches(res.data);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	};

	const clearFilter = () => {
		setCourseFilter('');
		setAppliedFilter('');
		setIndex(0);
		setLoading(true);
		axios
			.get('/matches', {
				headers: { Authorization: `Bearer ${token}` },
			})
			.then((res) => {
				setMatches(res.data);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	};

	const handleAction = async (action: 'like' | 'pass') => {
		const user = matches[index];
		const res = await axios.post(
			'/matches/action',
			{
				to_user_id: user.id,
				action,
			},
			{
				headers: { Authorization: `Bearer ${token}` },
			},
		);

		if (res.data.is_mutual) {
			alert(
				`You and ${user.username} both liked each other! You can now see each other's social links.`,
			);
		}

		setIndex((i) => i + 1);
	};

	if (loading)
		return (
			<div className="csoc-page flex items-center justify-center text-[var(--csoc-muted)]">
				Loading…
			</div>
		);

	if (error)
		return (
			<div className="csoc-page flex items-center justify-center">
				<div className="text-center px-6">
					<p className="text-[var(--csoc-muted)] mb-4">{error}</p>
					<button
						onClick={() => navigate('/profile')}
						className="csoc-btn-ghost text-[var(--csoc-accent)]"
					>
						Go to Profile
					</button>
				</div>
			</div>
		);

	if (matches.length === 0 || index >= matches.length)
		return (
			<div className="csoc-page">
				<header className="csoc-header">
					<button onClick={() => navigate('/')} className="csoc-brand">
						csoc
					</button>
				</header>
				<div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
					<h2 className="font-display text-3xl font-extrabold tracking-tight mb-3">
						You're all caught up
					</h2>
					<p className="text-[var(--csoc-muted)] mb-8 max-w-sm">
						No more people to meet right now. Check back later.
					</p>
					<button
						onClick={() => navigate('/')}
						className="csoc-btn-ghost inline-flex items-center gap-1 text-[var(--csoc-accent)]"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to home
					</button>
				</div>
			</div>
		);

	const user = matches[index];

	return (
		<div className="csoc-page">
			<header className="csoc-header">
				<button onClick={() => navigate('/')} className="csoc-brand">
					csoc
				</button>
				<span className="text-sm text-[var(--csoc-muted)]">
					{index + 1} of {matches.length}
				</span>
			</header>

			<div className="max-w-lg mx-auto px-6 py-10">
				<div className="flex gap-2 mb-8">
					<input
						placeholder="Filter by course..."
						value={courseFilter}
						onChange={(e) => setCourseFilter(e.target.value)}
						className="csoc-input flex-1"
					/>
					<button onClick={applyFilter} className="csoc-btn-ink text-sm shrink-0">
						Apply
					</button>
					{appliedFilter && (
						<button onClick={clearFilter} className="csoc-btn-ghost text-sm shrink-0">
							Clear
						</button>
					)}
				</div>

				<article className="csoc-panel csoc-rise mb-6">
					<h2 className="font-display text-3xl font-extrabold tracking-tight mb-5">
						{user.username}
					</h2>

					<div className="flex flex-col gap-2.5">
						{user.course && (
							<div className="flex gap-3 text-sm">
								<span className="text-[var(--csoc-muted)] w-16 shrink-0">Studies</span>
								<span>{user.course}</span>
							</div>
						)}
						{user.location && (
							<div className="flex gap-3 text-sm">
								<span className="text-[var(--csoc-muted)] w-16 shrink-0">Based in</span>
								<span>{user.location}</span>
							</div>
						)}
						{user.interests && (
							<div className="flex gap-3 text-sm">
								<span className="text-[var(--csoc-muted)] w-16 shrink-0">Into</span>
								<span>{user.interests}</span>
							</div>
						)}
						{user.bio && (
							<p className="text-[var(--csoc-muted)] text-sm mt-3 leading-relaxed">
								{user.bio}
							</p>
						)}
						{user.github_username && (
							<a
								href={`https://github.com/${user.github_username}`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 text-sm mt-4 pt-4 border-t border-[var(--csoc-line)] text-[var(--csoc-muted)] hover:text-[var(--csoc-accent)] transition w-fit"
							>
								<Code2 className="w-4 h-4" />
								{user.github_username}
							</a>
						)}
					</div>
				</article>

				<div className="flex gap-3">
					<button
						onClick={() => handleAction('pass')}
						className="flex-1 border border-[var(--csoc-line)] bg-white py-4 font-semibold transition hover:border-[var(--csoc-ink)] inline-flex items-center justify-center gap-2"
					>
						<X className="w-5 h-5" />
						Pass
					</button>
					<button
						onClick={() => handleAction('like')}
						className="csoc-btn flex-1 py-4 inline-flex items-center justify-center gap-2"
					>
						<Heart className="w-5 h-5" />
						Like
					</button>
				</div>
			</div>
		</div>
	);
}

export default Match;
