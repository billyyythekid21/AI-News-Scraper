import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Check } from 'lucide-react';

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

const emptyForm = {
	title: '',
	description: '',
	location: '',
	starts_at: '',
	tags: '',
};

function Events() {
	const navigate = useNavigate();
	const [events, setEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [page, setPage] = useState(0);
	const [total, setTotal] = useState(0);
	const limit = 10;
	const [form, setForm] = useState(emptyForm);
	const [editingEventId, setEditingEventId] = useState<string | null>(null);
	const [editForm, setEditForm] = useState(emptyForm);
	const [myUsername, setMyUsername] = useState<string>('');

	const token = localStorage.getItem('token');

	const fetchEvents = async () => {
		try {
			const meRes = await axios.get('http://localhost:8000/me', {
				headers: { Authorization: `Bearer ${token}` },
			});
			const currentUsername = meRes.data.username;
			setMyUsername(currentUsername);

			const res = await axios.get(
				`http://localhost:8000/events?skip=${page * limit}&limit=${limit}`,
				{ headers: { Authorization: `Bearer ${token}` } },
			);
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
							(r: { username: string }) => r.username === currentUsername,
						),
					};
				}),
			);

			setEvents(eventsWithRsvp);
		} catch {
			if (!token) navigate('/login');
		} finally {
			setLoading(false);
		}
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
		setForm(emptyForm);
		setShowForm(false);
		fetchEvents();
	};

	const handleRsvp = async (event: Event) => {
		if (event.user_rsvpd) {
			await axios.delete(`http://localhost:8000/events/${event.id}/rsvp`, {
				headers: { Authorization: `Bearer ${token}` },
			});
		} else {
			await axios.post(
				`http://localhost:8000/events/${event.id}/rsvp`,
				{},
				{ headers: { Authorization: `Bearer ${token}` } },
			);
		}
		fetchEvents();
	};

	const handleDelete = async (eventId: string) => {
		if (!confirm('Delete this event?')) return;
		await axios.delete(`http://localhost:8000/events/${eventId}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		fetchEvents();
	};

	const handleEdit = async (eventId: string) => {
		await axios.patch(`http://localhost:8000/events/${eventId}`, editForm, {
			headers: { Authorization: `Bearer ${token}` },
		});
		setEditingEventId(null);
		fetchEvents();
	};

	if (loading)
		return (
			<div className="csoc-page flex items-center justify-center text-[var(--csoc-muted)]">
				Loading…
			</div>
		);

	return (
		<div className="csoc-page">
			<header className="csoc-header">
				<button onClick={() => navigate('/')} className="csoc-brand">
					csoc
				</button>
				<button
					onClick={() => setShowForm(!showForm)}
					className={`text-sm font-medium inline-flex items-center gap-1 ${
						showForm ? 'csoc-btn-ghost' : 'csoc-btn'
					}`}
				>
					{showForm ? (
						'Cancel'
					) : (
						<>
							<Plus className="w-4 h-4" />
							Post event
						</>
					)}
				</button>
			</header>

			<div className="max-w-lg mx-auto px-6 py-10">
				<h1 className="font-display text-4xl font-extrabold tracking-tight mb-8">
					Events
				</h1>

				{showForm && (
					<form
						onSubmit={handleSubmit}
						className="csoc-panel mb-8 flex flex-col gap-4"
					>
						<h2 className="font-display text-lg font-bold">New event</h2>
						<input
							name="title"
							placeholder="Title"
							value={form.title}
							onChange={handleChange}
							required
							className="csoc-input"
						/>
						<textarea
							name="description"
							placeholder="Description"
							value={form.description}
							onChange={handleChange}
							rows={5}
							className="csoc-input resize-none"
						/>
						<input
							name="location"
							placeholder="Location"
							value={form.location}
							onChange={handleChange}
							className="csoc-input"
						/>
						<input
							name="starts_at"
							type="datetime-local"
							value={form.starts_at}
							onChange={handleChange}
							required
							className="csoc-input"
						/>
						<input
							name="tags"
							placeholder="Tags (e.g. study, cs, social)"
							value={form.tags}
							onChange={handleChange}
							className="csoc-input"
						/>
						<button type="submit" className="csoc-btn inline-flex items-center justify-center gap-1">
							<Plus className="w-4 h-4" />
							Post event
						</button>
					</form>
				)}

				{events.length === 0 && (
					<div className="py-20 text-center">
						<p className="text-[var(--csoc-muted)] mb-1">No events yet.</p>
						<p className="text-sm text-[var(--csoc-muted)]">Be the first to post one.</p>
					</div>
				)}

				<div className="divide-y divide-[var(--csoc-line)] border-y border-[var(--csoc-line)]">
					{events.map((event) => (
						<article key={event.id} className="py-6">
							<div className="flex items-start justify-between gap-4 mb-3">
								<h2 className="font-display text-xl font-bold tracking-tight">
									{event.title}
								</h2>
								<button
									onClick={() => handleRsvp(event)}
									className={`text-sm px-3 py-1.5 font-medium shrink-0 inline-flex items-center gap-1 transition ${
										event.user_rsvpd
											? 'bg-[var(--csoc-accent)]/10 text-[var(--csoc-accent)]'
											: 'border border-[var(--csoc-line)] bg-white hover:border-[var(--csoc-accent)]'
									}`}
								>
									<Check className="w-4 h-4" />
									{event.user_rsvpd ? 'Going' : 'RSVP'}
								</button>
							</div>

							{event.description && (
								<p className="text-sm text-[var(--csoc-muted)] leading-relaxed mb-4">
									{event.description}
								</p>
							)}

							<div className="flex flex-col gap-2 text-sm">
								<div className="flex gap-3">
									<span className="text-[var(--csoc-muted)] w-14">By</span>
									<span>{event.organizer}</span>
								</div>
								<div className="flex gap-3">
									<span className="text-[var(--csoc-muted)] w-14">When</span>
									<span>{new Date(event.starts_at).toLocaleString()}</span>
								</div>
								{event.location && (
									<div className="flex gap-3">
										<span className="text-[var(--csoc-muted)] w-14">Where</span>
										<span>{event.location}</span>
									</div>
								)}
								{event.tags && (
									<div className="flex gap-3">
										<span className="text-[var(--csoc-muted)] w-14">Tags</span>
										<span>{event.tags}</span>
									</div>
								)}
							</div>

							{event.organizer === myUsername && (
								<div className="flex gap-3 mt-4">
									<button
										onClick={() => {
											setEditingEventId(event.id);
											setEditForm({
												title: event.title,
												description: event.description,
												location: event.location || '',
												starts_at: event.starts_at.slice(0, 16),
												tags: event.tags || '',
											});
										}}
										className="csoc-btn-ghost text-xs"
									>
										Edit
									</button>
									<button
										onClick={() => handleDelete(event.id)}
										className="csoc-btn-ghost text-xs hover:text-[var(--csoc-spot)]"
									>
										Delete
									</button>
								</div>
							)}

							{editingEventId === event.id && (
								<div className="mt-4 flex flex-col gap-3 border-t border-[var(--csoc-line)] pt-4">
									<input
										placeholder="Title"
										value={editForm.title}
										onChange={(e) =>
											setEditForm({ ...editForm, title: e.target.value })
										}
										className="csoc-input"
									/>
									<textarea
										placeholder="Description"
										value={editForm.description}
										onChange={(e) =>
											setEditForm({ ...editForm, description: e.target.value })
										}
										rows={2}
										className="csoc-input resize-none"
									/>
									<input
										placeholder="Location"
										value={editForm.location}
										onChange={(e) =>
											setEditForm({ ...editForm, location: e.target.value })
										}
										className="csoc-input"
									/>
									<input
										type="datetime-local"
										value={editForm.starts_at}
										onChange={(e) =>
											setEditForm({ ...editForm, starts_at: e.target.value })
										}
										className="csoc-input"
									/>
									<input
										placeholder="Tags"
										value={editForm.tags}
										onChange={(e) =>
											setEditForm({ ...editForm, tags: e.target.value })
										}
										className="csoc-input"
									/>
									<div className="flex gap-3 items-center">
										<button
											onClick={() => handleEdit(event.id)}
											className="csoc-btn text-sm"
										>
											Save
										</button>
										<button
											onClick={() => setEditingEventId(null)}
											className="csoc-btn-ghost text-sm"
										>
											Cancel
										</button>
									</div>
								</div>
							)}
						</article>
					))}
				</div>

				{total > 0 && (
					<div className="flex gap-4 mt-8 items-center">
						<button
							onClick={() => setPage((p) => p - 1)}
							disabled={page === 0}
							className="csoc-btn-ghost text-sm disabled:opacity-30"
						>
							← Previous
						</button>
						<span className="text-gray-600 text-sm">
							{page + 1} of {Math.max(1, Math.ceil(total / limit))}
						</span>
						<button
							onClick={() => setPage((p) => p + 1)}
							disabled={(page + 1) * limit >= total}
							className="csoc-btn-ghost text-sm disabled:opacity-30"
						>
							Next →
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

export default Events;
