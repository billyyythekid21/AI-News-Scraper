import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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

	if (!user) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[var(--csoc-paper)] text-[var(--csoc-muted)]">
				Loading…
			</div>
		);
	}

	const secondary = [
		{ label: 'Your matches', path: '/matches', hint: 'People who liked you back' },
		{ label: 'Events', path: '/events', hint: 'What’s on this week' },
		{ label: 'Search', path: '/search', hint: 'Find students or events' },
		{ label: 'Edit profile', path: '/profile', hint: 'Bio, course, links' },
	];

	return (
		<div className="min-h-screen bg-[var(--csoc-paper)] text-[var(--csoc-ink)]">
			<header className="flex items-center justify-between border-b border-[var(--csoc-line)] px-6 py-5">
				<span className="font-display text-2xl font-extrabold tracking-tight">
					csoc
				</span>
				<button
					onClick={logout}
					className="text-sm text-[var(--csoc-muted)] transition hover:text-[var(--csoc-spot)]"
				>
					Log out
				</button>
			</header>

			<main className="mx-auto max-w-xl px-6 py-14">
				<div className="csoc-rise">
					<p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--csoc-muted)]">
						{user.course || 'Computer Science'}
					</p>
					<h1 className="mt-3 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
						Hello {user.username}.
					</h1>
					<p className="mt-4 max-w-md text-lg text-[var(--csoc-muted)] leading-relaxed">
						Find someone to sit with in your labs every week, or show up to the
						next big thing on campus.
					</p>
				</div>

				<div className="csoc-rise-delay mt-10">
					<button
						onClick={() => navigate('/match')}
						className="group relative w-full overflow-hidden bg-[var(--csoc-ink)] px-6 py-6 text-left text-white transition hover:bg-[var(--csoc-accent)]"
					>
						<span className="block font-display text-2xl font-bold tracking-tight">
							Find people
						</span>
						<span className="mt-1 block text-sm text-white/60 group-hover:text-white/80">
							Swipe through students who have amazing vibes
						</span>
						<span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl transition group-hover:translate-x-1">
							→
						</span>
					</button>
				</div>

				<nav className="csoc-fade mt-4 divide-y divide-[var(--csoc-line)] border-y border-[var(--csoc-line)]">
					{secondary.map((item) => (
						<button
							key={item.path}
							onClick={() => navigate(item.path)}
							className="flex w-full items-baseline justify-between gap-4 py-4 text-left transition hover:text-[var(--csoc-accent)]"
						>
							<span className="font-semibold">{item.label}</span>
							<span className="text-sm text-[var(--csoc-muted)]">
								{item.hint}
							</span>
						</button>
					))}
				</nav>
			</main>
		</div>
	);
}

export default Home;
