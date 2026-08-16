import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
	ArrowLeft,
	Trash2,
	Code2,
	Camera,
	Users,
	Mail,
	Globe,
	MessageCircle,
} from 'lucide-react';

interface UserProfile {
	username: string;
	email: string;
	bio: string;
	location: string;
	course: string;
	contact: string;
	interests: string;
	github_username: string;
	instagram: string;
	facebook: string;
	website: string;
	contact_email: string;
	discord: string;
}

const inputClass = 'csoc-input';

function Profile() {
	const navigate = useNavigate();
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [form, setForm] = useState({
		bio: '',
		location: '',
		course: '',
		contact: '',
		interests: '',
		github_username: '',
		instagram: '',
		facebook: '',
		website: '',
		contact_email: '',
		discord: '',
	});
	const [saved, setSaved] = useState<boolean>(false);
	const [timetableStatus, setTimetableStatus] = useState<string | null>(null);

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
				setProfile(res.data);
				setForm({
					bio: res.data.bio || '',
					location: res.data.location || '',
					course: res.data.course || '',
					contact: res.data.contact || '',
					interests: res.data.interests || '',
					github_username: res.data.github_username || '',
					instagram: res.data.instagram || '',
					facebook: res.data.facebook || '',
					website: res.data.website || '',
					contact_email: res.data.contact_email || '',
					discord: res.data.discord || '',
				});
			})
			.catch(() => {
				localStorage.removeItem('token');
				navigate('/login');
			});
	}, []);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const logout = () => {
		localStorage.removeItem('token');
		navigate('/login');
	};

	const deleteAccount = async () => {
		if (
			!confirm(
				'Are you sure you want to delete your account? This cannot be undone.',
			)
		)
			return;
		await axios.delete('http://localhost:8000/me', {
			headers: { Authorization: `Bearer ${token}` },
		});
		localStorage.removeItem('token');
		navigate('/signup');
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await axios.patch('http://localhost:8000/me', form, {
			headers: { Authorization: `Bearer ${token}` },
		});
		setSaved(true);
		setTimeout(() => {
			setSaved(false);
		}, 2000);
	};

	const handleTimetableUpload = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const formData = new FormData();
		formData.append('file', file);

		try {
			const res = await axios.post(
				'http://localhost:8000/me/timetable',
				formData,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': 'multipart/form-data',
					},
				},
			);
			setTimetableStatus(`${res.data.slots_saved} free slots imported.`);
		} catch {
			setTimetableStatus('Import failed. Calendar must be a valid .ics file.');
		}
	};

	if (!profile)
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
					onClick={logout}
					className="csoc-btn-ghost text-sm hover:text-[var(--csoc-spot)]"
				>
					Log out
				</button>
			</header>

			<div className="max-w-lg mx-auto px-6 py-12">
				<div className="mb-8">
					<h1 className="font-display text-4xl font-extrabold tracking-tight">
						{profile.username}
					</h1>
					<p className="text-[var(--csoc-muted)] mt-1">Edit your profile</p>
				</div>

				<form onSubmit={handleSubmit} className="flex flex-col gap-5">
					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium">Bio</label>
						<textarea
							name="bio"
							placeholder="Tell people about yourself..."
							value={form.bio}
							onChange={handleChange}
							rows={3}
							className={`${inputClass} resize-none`}
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium">Course</label>
						<input
							name="course"
							placeholder="e.g. Computer Science"
							value={form.course}
							onChange={handleChange}
							className={inputClass}
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium">Location</label>
						<input
							name="location"
							placeholder="e.g. Melbourne"
							value={form.location}
							onChange={handleChange}
							className={inputClass}
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium">Contact</label>
						<input
							name="contact"
							placeholder="e.g. Discord handle"
							value={form.contact}
							onChange={handleChange}
							className={inputClass}
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium">Interests</label>
						<input
							name="interests"
							placeholder="e.g. hiking, chess, ml"
							value={form.interests}
							onChange={handleChange}
							className={inputClass}
						/>
						<p className="text-xs text-[var(--csoc-muted)] mt-1">
							Separate with commas. This powers your match suggestions.
						</p>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-sm font-medium">Timetable</label>
						<input
							type="file"
							accept=".ics"
							onChange={handleTimetableUpload}
							className="text-sm text-[var(--csoc-muted)]"
						/>
						{timetableStatus && (
							<p className="text-xs text-[var(--csoc-accent)] mt-1">
								{timetableStatus}
							</p>
						)}
						<p className="text-xs text-[var(--csoc-muted)]">
							Upload your .ics timetable to auto-fill free blocks.
						</p>
					</div>

					<h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--csoc-muted)] mt-2 pt-4 border-t border-[var(--csoc-line)]">
						Links
					</h2>

					{(
						[
							['github_username', 'GitHub', 'e.g. yourusername', Code2],
							[
								'instagram',
								'Instagram',
								'https://instagram.com/yourusername',
								Camera,
							],
							[
								'facebook',
								'Facebook',
								'https://facebook.com/yourusername',
								Users,
							],
							['website', 'Website', 'https://yourwebsite.com', Globe],
							['contact_email', 'Email', 'you@example.com', Mail],
							['discord', 'Discord', 'e.g. yourusername', MessageCircle],
						] as const
					).map(([name, label, placeholder, Icon]) => (
						<div key={name} className="flex flex-col gap-1.5">
							<label className="text-sm font-medium inline-flex items-center gap-1.5">
								<Icon className="w-4 h-4" />
								{label}
							</label>
							<input
								name={name}
								type={name === 'contact_email' ? 'email' : 'text'}
								placeholder={placeholder}
								value={form[name]}
								onChange={handleChange}
								className={inputClass}
							/>
							{name === 'github_username' && (
								<p className="text-xs text-[var(--csoc-muted)] mt-1">
									Links your GitHub profile to improve match suggestions.
								</p>
							)}
						</div>
					))}

					<button type="submit" className="csoc-btn mt-2">
						{saved ? 'Saved!' : 'Save profile'}
					</button>
				</form>

				<div className="flex gap-6 mt-8">
					<button
						onClick={() => navigate('/')}
						className="csoc-btn-ghost text-sm inline-flex items-center gap-1 text-[var(--csoc-accent)]"
					>
						<ArrowLeft className="w-4 h-4" />
						Home
					</button>
					<button
						onClick={deleteAccount}
						className="csoc-btn-ghost text-sm inline-flex items-center gap-1 hover:text-[var(--csoc-spot)]"
					>
						<Trash2 className="w-4 h-4" />
						Delete account
					</button>
				</div>
			</div>
		</div>
	);
}

export default Profile;
