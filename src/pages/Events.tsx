import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Plus, Check } from 'lucide-react';

interface Event {
	id: string;
	title: string;
	description: string;
	location: string;
	starts_at: string;
	tags: string;
	organizer: string;
	rsvp_count?: number;
	user_rsvpd?: boolean;
}

function Events() {
	const navigate = useNavigate();
	const [events, setEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [page, setPage] = useState(0);
	const [total, setTotal] = useState(0);
	const limit = 10;
	const [form, setForm] = useState({
		title: '',
		description: '',
		location: '',
		starts_at: '',
		tags: '',
	});
	const [editingEventId, setEditingEventId] = useState<string | null>(null);
	const [editForm, setEditForm] = useState({
		title: '',
		description: '',
		location: '',
		starts_at: '',
		tags: '',
	});
	
	const token = localStorage.getItem('token');

	const fetchEvents = async () => {
		const meRes = await axios.get('http://localhost:8000/me', {
			headers: { Authorization: `Bearer ${token}` },
		});
		const myUsername = meRes.data.username;

		const res = await axios.get(`http://localhost:8000/events?skip=${page * limit}&limit=${limit}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		setTotal(res.data.total);

		const eventsWithRsvp = await Promise.all(
			res.data.events.map(async (event: Event) => {
				const rsvpRes = await axios.get(
					`http://localhost:8000/events/${event.id}/rsvps`,
					{ headers: { Authorization: `Bearer ${token}` } },
				);
				const rsvps = rsvpRes.data;
				return {
					...event,
					rsvp_count: rsvps.length,
					user_rsvpd: rsvps.some(
						(r: { username: string }) => r.username === myUsername,
					),
				};
			}),
		);

		setEvents(eventsWithRsvp);
		setLoading(false);
		setMyUsername(meRes.data.username);
	};

	useEffect(() => {
		if (!token) {
			navigate('/login');
			return;
		}
		fetchEvents();
	}, [page]);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await axios.post('http://localhost:8000/events', form, {
			headers: { Authorization: `Bearer ${token}` },
		});
		setShowForm(false);
		fetchEvents();
	};

	const handleRsvp = async (event: Event) => {
		if (event.user_rsvpd) {
			await axios.delete(
				`http://localhost:8000/events/${event.id}/rsvp`,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
		} else {
			await axios.post(
				`http://localhost:8000/events/${event.id}/rsvp`,
				{},
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
		}
		fetchEvents();
	};

	if (loading)
		return (
			<div className="min-h-screen bg-black flex items-center justify-center">
				<div className="text-gray-500">Loading...</div>
			</div>
		);

	return (
		<div className="min-h-screen bg-black text-white">
			<div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
				<button
					onClick={() => navigate('/')}
					className="text-black-500 font-bold text-lg"
				>
					csoc
				</button>
				<button
					onClick={() => setShowForm(!showForm)}
					className={`text-sm px-4 py-2 rounded-lg font-medium transition ${
						showForm
							? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
							: 'bg-green-500 hover:bg-green-400 text-black'
					} inline-flex items-center gap-1`}
				>
					{showForm ? (
						'Cancel'
					) : (
						<>
							<Plus className="w-4 h-4" />
							Post Event
						</>
					)}
				</button>
			</div>

			<div className="max-w-lg mx-auto px-6 py-8">
				<h1 className="text-3xl font-bold mb-8 text-center">Events</h1>

				{showForm && (
					<form
						onSubmit={handleSubmit}
						className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8 flex flex-col gap-4"
					>
						<h2 className="text-lg font-semibold">New Event</h2>
						<input
							name="title"
							placeholder="Title"
							onChange={handleChange}
							required
							className="bg-black border border-gray-700 text-white placeholder-gray-600 rounded-lg px-4 py-3 text-sm outline-none focus:border-green-500 transition"
						/>
						<textarea
							name="description"
							placeholder="Description"
							onChange={handleChange}
							rows={6}
							className="bg-black border border-gray-700 text-white placeholder-gray-600 rounded-lg px-4 py-3 text-sm outline-none focus:border-green-500 transition resize-none"
						/>
						<input
							name="location"
							placeholder="Location"
							onChange={handleChange}
							className="bg-black border border-gray-700 text-white placeholder-gray-600 rounded-lg px-4 py-3 text-sm outline-none focus:border-green-500 transition"
						/>
						<input
							name="starts_at"
							type="datetime-local"
							onChange={handleChange}
							required
							className="bg-black border border-gray-700 text-white rounded-lg px-4 py-3 text-sm outline-none focus:border-green-500 transition"
						/>
						<input
							name="tags"
							placeholder="Tags (e.g. study, cs, social)"
							onChange={handleChange}
							className="bg-black border border-gray-700 text-white placeholder-gray-600 rounded-lg px-4 py-3 text-sm outline-none focus:border-green-500 transition"
						/>
					<button
						type="submit"
						className="bg-green-500 hover:bg-green-400 text-black rounded-lg px-4 py-3 text-sm font-medium transition inline-flex items-center justify-center gap-1"
					>
						<Plus className="w-4 h-4" />
						Post Event
					</button>
					</form>
				)}
			</div>

			{events.length === 0 && (
				<div className="flex flex-col items-center justify-center py-24 text-center">
					<Calendar className="w-10 h-10 mb-4 text-gray-500" />
					<p className="text-gray-400 mb-2">No events yet.</p>
					<p className="text-gray-600 text-sm">
						Be the first to post one!
					</p>
				</div>
			)}

			<div className="flex flex-col gap-4 px-[30%]">
				{events.map((event) => (
					<div
						key={event.id}
						className="bg-gray-900 border border-gray-800 rounded-2xl p-6"
					>
						<div className="flex items-center justify-between mb-3">
							<h2 className="text-lg font-bold text-white">
								{event.title}
							</h2>
							<button
								onClick={() => handleRsvp(event)}
								className={`text-sm px-3 py-1 rounded-lg font-medium transition ml-4 shrink-0 inline-flex items-center gap-1 ${
									event.user_rsvpd
										? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400'
										: 'bg-gray-800 text-gray-300 hover:bg-green-500/20 hover:text-green-400'
								}`}
							>
								<Check className="w-4 h-4" />
								{event.user_rsvpd ? 'Going' : 'RSVP'}
							</button>
						</div>

						{event.description && (
							<p className="text-gray-300 text-sm leading-relaxed mb-4">
								{event.description}
							</p>
						)}

						<div className="flex flex-col gap-2">
							<div className="flex gap-2 text-sm">
								<span className="text-gray-500">
									Posted by:
								</span>
								<span className="text-white">
									{event.organizer}
								</span>
							</div>
							<div className="flex gap-2 text-sm">
								<span className="text-gray-500">When:</span>
								<span className="text-white">
									{new Date(event.starts_at).toLocaleString()}
								</span>
							</div>
							{event.location && (
								<div className="flex gap-2 text-sm">
									<span className="text-gray-500">
										Where:
									</span>
									<span className="text-white">
										{event.location}
									</span>
								</div>
							)}
							{event.tags && (
								<div className="flex gap-2 text-sm">
									<span className="text-gray-500">Tags:</span>
									<span className="text-white">
										{event.tags}
									</span>
								</div>
							)}
						</div>
					</div>
				))}

				<div className="flex gap-4 mt-6 items-center">
					<button
						onClick={() => setPage(p => p - 1)}
						disabled={page === 0}
						className="text-gray-500 hover:text-white text-sm transition disabled:opacity-30"
					>
						← Previous
					</button>
					<span className="text-gray-500 text-sm">{page + 1} of {Math.ceil(total / limit)}</span>
					<button
						onClick={() => setPage(p => p + 1)}
						disabled={(page + 1) * limit >= total}
						className="text-gray-500 hover:text-white text-sm transition disabled:opacity-30"
					>
						Next →
					</button>
				</div>
			</div>
		</div>
	);
}

export default Events;
