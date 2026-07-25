import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
	Heart,
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

	if (loading)
		return (
			<div className="min-h-screen bg-black flex items-center justify-center">
				<div className="text-gray-500">Loading...</div>
			</div>
		);

	const getIcebreaker = async (userId: string) => {
		setLoadingIcebreaker((prev) => ({ ...prev, [userId]: true }));
		const res = await axios.get(
			`http://localhost:8000/matches/mutual/${userId}/icebreaker`,
			{ headers: { Authorization: `Bearer ${token}` } },
		);
		setIcebreakers((prev) => ({ ...prev, [userId]: res.data.icebreaker }));
		setLoadingIcebreaker((prev) => ({ ...prev, [userId]: false }));
	};

	const handleUnlike = async (userId: string) => {
		await axios.delete(`http://localhost:8000/matches/action/${userId}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		setMatches((prev) => prev.filter((match) => match.id !== userId));
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
				<span className="text-gray-500 text-sm">
					{tab === 'matches'
						? `${matches.length} ${matches.length === 1 ? 'match' : 'matches'}`
						: `${liked.length} liked`}
				</span>
			</div>

			<div className="max-w-lg mx-auto px-6 py-8">
				<h1 className="text-3xl font-bold mb-6">Your Matches</h1>

				<div className="flex gap-2 mb-8">
					<button
						onClick={() => setTab('matches')}
						className={`text-sm px-4 py-2 rounded-lg font-medium transition ${
							tab === 'matches'
								? 'bg-green-500 text-black'
								: 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
						}`}
					>
						Matches ({matches.length})
					</button>
					<button
						onClick={() => setTab('liked')}
						className={`text-sm px-4 py-2 rounded-lg font-medium transition ${
							tab === 'liked'
								? 'bg-green-500 text-black'
								: 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
						}`}
					>
						Liked ({liked.length})
					</button>
				</div>

				{tab === 'matches' && matches.length === 0 && (
					<div className="flex flex-col items-center justify-center py-24 text-center">
						<Heart className="w-10 h-10 mb-4 text-green-500" />
						<p className="text-black-400 mb-4">
							No mutual matches yet.
						</p>
						<button
							onClick={() => navigate('/match')}
							className="text-black-500 hover:underline text-sm"
						>
							Find people →
						</button>
					</div>
				)}

				{tab === 'liked' && liked.length === 0 && (
					<div className="flex flex-col items-center justify-center py-24 text-center">
						<div className="text-4xl mb-4">👀</div>
						<p className="text-gray-400 mb-4">
							You haven't liked anyone yet.
						</p>
						<button
							onClick={() => navigate('/match')}
							className="text-green-500 hover:underline text-sm"
						>
							Find people →
						</button>
					</div>
				)}

				{tab === 'liked' && liked.length > 0 && (
					<div className="flex flex-col gap-4">
						{liked.map((user) => (
							<div
								key={user.id}
								className="bg-gray-900 border border-gray-800 rounded-2xl p-6"
							>
								<h2 className="text-xl font-bold text-white mb-3">
									{user.username}
								</h2>
								<div className="flex flex-col gap-2">
									{user.course && (
										<div className="flex gap-2 text-sm">
											<span className="text-gray-500">
												Studies
											</span>
											<span className="text-white">
												{user.course}
											</span>
										</div>
									)}
									{user.location && (
										<div className="flex gap-2 text-sm">
											<span className="text-gray-500">
												Based in
											</span>
											<span className="text-white">
												{user.location}
											</span>
										</div>
									)}
									{user.interests && (
										<div className="flex gap-2 text-sm">
											<span className="text-gray-500">
												Into
											</span>
											<span className="text-white">
												{user.interests}
											</span>
										</div>
									)}
									{user.bio && (
										<p className="text-gray-300 text-sm mt-1 leading-relaxed">
											{user.bio}
										</p>
									)}
								</div>
								<p className="text-gray-500 text-xs mt-3 pt-3 border-t border-gray-800">
									Waiting for them to like you back
								</p>
							</div>
						))}
					</div>
				)}

				{tab === 'matches' && (
					<div className="flex flex-col gap-4">
						{matches.map((match) => (
							<div
								key={match.id}
								className="bg-gray-900 border border-gray-800 rounded-2xl p-6"
							>
								<h2 className="text-xl font-bold text-white mb-3">
									{match.username}
								</h2>

								<div className="flex flex-col gap-2 mb-4">
									{match.course && (
										<div className="flex gap-2 text-sm">
											<span className="text-gray-500">
												Studies
											</span>
											<span className="text-white">
												{match.course}
											</span>
										</div>
									)}
									{match.location && (
										<div className="flex gap-2 text-sm">
											<span className="text-gray-500">
												Based in
											</span>
											<span className="text-white">
												{match.location}
											</span>
										</div>
									)}
									{match.interests && (
										<div className="flex gap-2 text-sm">
											<span className="text-gray-500">
												Into
											</span>
											<span className="text-white">
												{match.interests}
											</span>
										</div>
									)}
									{match.bio && (
										<p className="text-gray-300 text-sm mt-1 leading-relaxed">
											{match.bio}
										</p>
									)}
									{match.contact && (
										<div className="flex gap-2 text-sm pt-3 mt-1 border-t border-gray-800">
											<span className="text-gray-500">
												Contact
											</span>
											<span className="text-green-400">
												{match.contact}
											</span>
										</div>
									)}
									{match.discord && (
										<div className="flex gap-2 text-sm items-center">
											<MessageCircle className="w-4 h-4 text-gray-500" />
											<span className="text-white">
												{match.discord}
											</span>
										</div>
									)}
									{(match.github_username ||
										match.instagram ||
										match.facebook ||
										match.website ||
										match.contact_email) && (
										<div className="flex gap-3 pt-3 mt-1 border-t border-gray-800">
											{match.github_username && (
												<a
													href={`https://github.com/${match.github_username}`}
													target="_blank"
													rel="noopener noreferrer"
													className="text-gray-400 hover:text-green-400 transition"
												>
													<Code2 className="w-5 h-5" />
												</a>
											)}
											{match.instagram && (
												<a
													href={match.instagram}
													target="_blank"
													rel="noopener noreferrer"
													className="text-gray-400 hover:text-green-400 transition"
												>
													<Camera className="w-5 h-5" />
												</a>
											)}
											{match.facebook && (
												<a
													href={match.facebook}
													target="_blank"
													rel="noopener noreferrer"
													className="text-gray-400 hover:text-green-400 transition"
												>
													<Users className="w-5 h-5" />
												</a>
											)}
											{match.website && (
												<a
													href={match.website}
													target="_blank"
													rel="noopener noreferrer"
													className="text-gray-400 hover:text-green-400 transition"
												>
													<Globe className="w-5 h-5" />
												</a>
											)}
											{match.contact_email && (
												<a
													href={`mailto:${match.contact_email}`}
													className="text-gray-400 hover:text-green-400 transition"
												>
													<Mail className="w-5 h-5" />
												</a>
											)}
										</div>
									)}
								</div>

								{icebreakers[match.id] ? (
									<div className="bg-black border border-gray-700 rounded-xl px-4 py-3 mt-2">
										<p className="text-gray-400 text-xs mb-1">
											Suggested opener
										</p>
										<p className="text-white text-sm italic">
											"{icebreakers[match.id]}"
										</p>
									</div>
								) : (
								<button
									onClick={() => getIcebreaker(match.id)}
									disabled={loadingIcebreaker[match.id]}
									className="w-full mt-2 border border-gray-700 hover:border-green-500 text-black-400 hover:text-white text-sm rounded-xl py-2 transition inline-flex items-center justify-center gap-2"
								>
									{loadingIcebreaker[match.id] ? (
										'Generating...'
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
								className="w-full mt-2 border border-gray-700 hover:border-red-500 text-black-400 hover:text-white text-sm rounded-xl py-2 transition inline-flex items-center justify-center gap-2"
							>
								<HeartOff className="w-4 h-4" />
								Unlike
							</button>
							</div>
						))}
					</div>
				)}

				<button
					onClick={() => navigate('/')}
					className="mt-8 text-black-500 hover:text-white text-sm transition inline-flex items-center gap-1"
				>
					<ArrowLeft className="w-4 h-4" />
					Back to home
				</button>
			</div>
		</div>
	);
}

export default Matches;
