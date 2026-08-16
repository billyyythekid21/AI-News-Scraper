import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
	Sparkles,
	HeartOff,
	ArrowLeft,
	Code2,
	Camera,
	Users,
	Mail,
	Globe,
	MessageCircle,
} from 'lucide-react';

interface MutualMatch {
	id: string;
	username: string;
	bio: string;
	course: string;
	interests: string;
	location: string;
	contact: string;
	github_username: string;
	instagram: string;
	facebook: string;
	website: string;
	contact_email: string;
	discord: string;
}

interface LikedUser {
	id: string;
	username: string;
	bio: string;
	course: string;
	interests: string;
	location: string;
}

function Matches() {
	const navigate = useNavigate();
	const [tab, setTab] = useState<'matches' | 'liked'>('matches');
	const [matches, setMatches] = useState<MutualMatch[]>([]);
	const [liked, setLiked] = useState<LikedUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [icebreakers, setIcebreakers] = useState<{ [key: string]: string }>(
		{},
	);
	const [loadingIcebreaker, setLoadingIcebreaker] = useState<{
		[key: string]: boolean;
	}>({});

	const token = localStorage.getItem('token');

	useEffect(() => {
		if (!token) {
			navigate('/login');
			return;
		}

		Promise.all([
			axios.get('http://localhost:8000/matches/mutual', {
				headers: { Authorization: `Bearer ${token}` },
			}),
			axios.get('http://localhost:8000/matches/liked', {
				headers: { Authorization: `Bearer ${token}` },
			}),
		])
			.then(([matchesRes, likedRes]) => {
				setMatches(matchesRes.data);
				setLiked(likedRes.data);
				setLoading(false);
			})
			.catch(() => {
				navigate('/login');
			});
	}, []);

	const getIcebreaker = async (userId: string) => {
		setLoadingIcebreaker((prev) => ({ ...prev, [userId]: true }));
		try {
			const res = await axios.get(
				`http://localhost:8000/matches/mutual/${userId}/icebreaker`,
				{ headers: { Authorization: `Bearer ${token}` } },
			);
			setIcebreakers((prev) => ({ ...prev, [userId]: res.data.icebreaker }));
		} finally {
			setLoadingIcebreaker((prev) => ({ ...prev, [userId]: false }));
		}
	};

	const handleUnlike = async (userId: string) => {
		await axios.delete(`http://localhost:8000/matches/action/${userId}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		setMatches((prev) => prev.filter((match) => match.id !== userId));
	};

	if (loading)
		return (
			<div className="csoc-page flex items-center justify-center text-[var(--csoc-muted)]">
				Loading…
			</div>
		);

	const list = tab === 'matches' ? matches : liked;

	return (
		<div className="csoc-page">
			<header className="csoc-header">
				<button onClick={() => navigate('/')} className="csoc-brand">
					csoc
				</button>
				<span className="text-sm text-[var(--csoc-muted)]">
					{tab === 'matches'
						? `${matches.length} ${matches.length === 1 ? 'match' : 'matches'}`
						: `${liked.length} liked`}
				</span>
			</header>

			<div className="max-w-lg mx-auto px-6 py-10">
				<h1 className="font-display text-4xl font-extrabold tracking-tight mb-6">
					Your matches
				</h1>

				<div className="flex gap-6 mb-8 border-b border-[var(--csoc-line)]">
					{(
						[
							['matches', `Matches (${matches.length})`],
							['liked', `Liked (${liked.length})`],
						] as const
					).map(([key, label]) => (
						<button
							key={key}
							onClick={() => setTab(key)}
							className={`csoc-btn-ghost pb-3 text-sm border-b-2 -mb-px rounded-none ${
								tab === key
									? 'border-[var(--csoc-ink)] text-[var(--csoc-ink)] font-semibold'
									: 'border-transparent'
							}`}
						>
							{label}
						</button>
					))}
				</div>

				{list.length === 0 && (
					<div className="py-20 text-center">
						<p className="text-[var(--csoc-muted)] mb-4">
							{tab === 'matches'
								? 'No mutual matches yet.'
								: "You haven't liked anyone yet."}
						</p>
						<button
							onClick={() => navigate('/match')}
							className="csoc-btn-ghost text-[var(--csoc-accent)]"
						>
							Find people →
						</button>
					</div>
				)}

				{tab === 'liked' && liked.length > 0 && (
					<div className="divide-y divide-[var(--csoc-line)] border-y border-[var(--csoc-line)]">
						{liked.map((user) => (
							<article key={user.id} className="py-6">
								<h2 className="font-display text-xl font-bold tracking-tight mb-3">
									{user.username}
								</h2>
								<div className="flex flex-col gap-2 text-sm">
									{user.course && (
										<div className="flex gap-3">
											<span className="text-[var(--csoc-muted)] w-16">Studies</span>
											<span>{user.course}</span>
										</div>
									)}
									{user.location && (
										<div className="flex gap-3">
											<span className="text-[var(--csoc-muted)] w-16">Based in</span>
											<span>{user.location}</span>
										</div>
									)}
									{user.interests && (
										<div className="flex gap-3">
											<span className="text-[var(--csoc-muted)] w-16">Into</span>
											<span>{user.interests}</span>
										</div>
									)}
									{user.bio && (
										<p className="text-[var(--csoc-muted)] mt-1 leading-relaxed">
											{user.bio}
										</p>
									)}
								</div>
								<p className="text-xs text-[var(--csoc-muted)] mt-4">
									Waiting for them to like you back
								</p>
							</article>
						))}
					</div>
				)}

				{tab === 'matches' && matches.length > 0 && (
					<div className="divide-y divide-[var(--csoc-line)] border-y border-[var(--csoc-line)]">
						{matches.map((match) => (
							<article key={match.id} className="py-6">
								<h2 className="font-display text-xl font-bold tracking-tight mb-3">
									{match.username}
								</h2>

								<div className="flex flex-col gap-2 text-sm mb-4">
									{match.course && (
										<div className="flex gap-3">
											<span className="text-[var(--csoc-muted)] w-16">Studies</span>
											<span>{match.course}</span>
										</div>
									)}
									{match.location && (
										<div className="flex gap-3">
											<span className="text-[var(--csoc-muted)] w-16">Based in</span>
											<span>{match.location}</span>
										</div>
									)}
									{match.interests && (
										<div className="flex gap-3">
											<span className="text-[var(--csoc-muted)] w-16">Into</span>
											<span>{match.interests}</span>
										</div>
									)}
									{match.bio && (
										<p className="text-[var(--csoc-muted)] mt-1 leading-relaxed">
											{match.bio}
										</p>
									)}
									{match.contact && (
										<div className="flex gap-3 pt-3 mt-1 border-t border-[var(--csoc-line)]">
											<span className="text-[var(--csoc-muted)] w-16">Contact</span>
											<span className="text-[var(--csoc-accent)]">{match.contact}</span>
										</div>
									)}
									{match.discord && (
										<div className="flex gap-2 items-center">
											<MessageCircle className="w-4 h-4 text-[var(--csoc-muted)]" />
											<span>{match.discord}</span>
										</div>
									)}
									{(match.github_username ||
										match.instagram ||
										match.facebook ||
										match.website ||
										match.contact_email) && (
										<div className="flex gap-3 pt-3 mt-1 border-t border-[var(--csoc-line)]">
											{match.github_username && (
												<a
													href={`https://github.com/${match.github_username}`}
													target="_blank"
													rel="noopener noreferrer"
													className="text-[var(--csoc-muted)] hover:text-[var(--csoc-accent)] transition"
												>
													<Code2 className="w-5 h-5" />
												</a>
											)}
											{match.instagram && (
												<a
													href={match.instagram}
													target="_blank"
													rel="noopener noreferrer"
													className="text-[var(--csoc-muted)] hover:text-[var(--csoc-accent)] transition"
												>
													<Camera className="w-5 h-5" />
												</a>
											)}
											{match.facebook && (
												<a
													href={match.facebook}
													target="_blank"
													rel="noopener noreferrer"
													className="text-[var(--csoc-muted)] hover:text-[var(--csoc-accent)] transition"
												>
													<Users className="w-5 h-5" />
												</a>
											)}
											{match.website && (
												<a
													href={match.website}
													target="_blank"
													rel="noopener noreferrer"
													className="text-[var(--csoc-muted)] hover:text-[var(--csoc-accent)] transition"
												>
													<Globe className="w-5 h-5" />
												</a>
											)}
											{match.contact_email && (
												<a
													href={`mailto:${match.contact_email}`}
													className="text-[var(--csoc-muted)] hover:text-[var(--csoc-accent)] transition"
												>
													<Mail className="w-5 h-5" />
												</a>
											)}
										</div>
									)}
								</div>

								{icebreakers[match.id] ? (
									<div className="bg-[var(--csoc-paper)] border border-[var(--csoc-line)] px-4 py-3 mt-2">
										<p className="text-[var(--csoc-muted)] text-xs mb-1">
											Suggested opener
										</p>
										<p className="text-sm italic">"{icebreakers[match.id]}"</p>
									</div>
								) : (
									<button
										onClick={() => getIcebreaker(match.id)}
										disabled={loadingIcebreaker[match.id]}
										className="w-full mt-2 border border-[var(--csoc-line)] bg-white text-sm py-2.5 transition hover:border-[var(--csoc-accent)] inline-flex items-center justify-center gap-2"
									>
										{loadingIcebreaker[match.id] ? (
											'Generating…'
										) : (
											<>
												<Sparkles className="w-4 h-4" />
												Get icebreaker
											</>
										)}
									</button>
								)}

								<button
									onClick={() => handleUnlike(match.id)}
									className="w-full mt-2 border border-[var(--csoc-line)] bg-white text-sm py-2.5 text-[var(--csoc-muted)] transition hover:border-[var(--csoc-spot)] hover:text-[var(--csoc-spot)] inline-flex items-center justify-center gap-2"
								>
									<HeartOff className="w-4 h-4" />
									Unlike
								</button>
							</article>
						))}
					</div>
				)}

				<button
					onClick={() => navigate('/')}
					className="mt-10 csoc-btn-ghost inline-flex items-center gap-1 text-[var(--csoc-accent)]"
				>
					<ArrowLeft className="w-4 h-4" />
					Back to home
				</button>
			</div>
		</div>
	);
}

export default Matches;
