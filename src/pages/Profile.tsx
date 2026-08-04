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

	const handleTimetableUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const formData = new FormData()
		formData.append('file', file);

		try {
			const res = await axios.post('http://localhost:8000/me/timetable', formData, {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'multipart/form-data',
				}
			});
			setTimetableStatus(`${res.data.slots_saved} free slots imported.`);
		} catch (err) {
			setTimetableStatus("Import failed. Calendar must be a valid .ics file.");
		}
	};

	if (!profile)
		return (
			<div className="min-h-screen bg-black flex items-center justify-center">
				<div className="text-white text-2xl font-bold">Loading...</div>
			</div>
		);

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
				{/* Title */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold">{profile.username}</h1>
					<p className="text-gray-500 mt-1">Edit your profile</p>
				</div>

				<form
					onSubmit={handleSubmit}
					className="flex flex-col gap-5"
				>
					<div className="flex flex-col gap-1">
						<label className="text-gray-400 text-sm">Bio</label>
						<textarea
							name="bio"
							placeholder="Tell people about yourself..."
							value={form.bio}
							onChange={handleChange}
							rows={3}
							className="bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-lg px-4 py-3 outline-none focus:border-green-500 transition resize-none"
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-gray-400 text-sm">Course</label>
						<input
							name="course"
							placeholder="e.g. Computer Science"
							value={form.course}
							onChange={handleChange}
							className="bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-lg px-4 py-3 outline-none focus:border-green-500 transition"
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-gray-400 text-sm">
							Location
						</label>
						<input
							name="location"
							placeholder="e.g. Melbourne"
							value={form.location}
							onChange={handleChange}
							className="bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-lg px-4 py-3 outline-none focus:border-green-500 transition"
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-gray-400 text-sm">Contact</label>
						<input
							name="contact"
							placeholder="e.g. Discord handle"
							value={form.contact}
							onChange={handleChange}
							className="bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-lg px-4 py-3 outline-none focus:border-green-500 transition"
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-gray-400 text-sm">
							Interests
						</label>
						<input
							name="interests"
							placeholder="e.g. hiking, chess, ml"
							value={form.interests}
							onChange={handleChange}
							className="bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-lg px-4 py-3 outline-none focus:border-green-500 transition"
						/>
						<p className="text-gray-600 text-xs mt-1">
							Separate with commas. This powers your match
							suggestions.
						</p>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-gray-400 text-sm">Timetable</label>
						<input
							type="file"
							accept=".ics"
							onChange={handleTimetableUpload}
							className="text-gray-400 text-sm"
						/>
						{timetableStatus && <p className="text-green-400 text-xs mt-1">{timetableStatus}</p>}
						<p className="text-gray-600 text-xs">Upload your .ics timetable to auto-fill your free calendar blocks.</p>
					</div>

					<h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-2">
						Links
					</h2>

					<div className="flex flex-col gap-1">
						<label className="text-gray-400 text-sm flex items-center gap-1.5">
							<Code2 className="w-4 h-4" />
							GitHub
						</label>
						<input
							name="github_username"
							placeholder="e.g. yourusername"
							value={form.github_username}
							onChange={handleChange}
							className="bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-lg px-4 py-3 outline-none focus:border-green-500 transition"
						/>
						<p className="text-gray-600 text-xs mt-1">
							Links your GitHub profile to improve your match
							suggestions.
						</p>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-gray-400 text-sm flex items-center gap-1.5">
							<Camera className="w-4 h-4" />
							Instagram
						</label>
						<input
							name="instagram"
							placeholder="https://instagram.com/yourusername"
							value={form.instagram}
							onChange={handleChange}
							className="bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-lg px-4 py-3 outline-none focus:border-green-500 transition"
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-gray-400 text-sm flex items-center gap-1.5">
							<Users className="w-4 h-4" />
							Facebook
						</label>
						<input
							name="facebook"
							placeholder="https://facebook.com/yourusername"
							value={form.facebook}
							onChange={handleChange}
							className="bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-lg px-4 py-3 outline-none focus:border-green-500 transition"
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-gray-400 text-sm flex items-center gap-1.5">
							<Globe className="w-4 h-4" />
							Website
						</label>
						<input
							name="website"
							placeholder="https://yourwebsite.com"
							value={form.website}
							onChange={handleChange}
							className="bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-lg px-4 py-3 outline-none focus:border-green-500 transition"
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-gray-400 text-sm flex items-center gap-1.5">
							<Mail className="w-4 h-4" />
							Email
						</label>
						<input
							name="contact_email"
							type="email"
							placeholder="you@example.com"
							value={form.contact_email}
							onChange={handleChange}
							className="bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-lg px-4 py-3 outline-none focus:border-green-500 transition"
						/>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-gray-400 text-sm flex items-center gap-1.5">
							<MessageCircle className="w-4 h-4" />
							Discord
						</label>
						<input
							name="discord"
							placeholder="e.g. yourusername"
							value={form.discord}
							onChange={handleChange}
							className="bg-gray-900 border border-gray-800 text-white placeholder-gray-600 rounded-lg px-4 py-3 outline-none focus:border-green-500 transition"
						/>
					</div>

					<button
						type="submit"
						className="bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg py-3 transition mt-2"
					>
						{saved ? 'Saved!' : 'Save Profile'}
					</button>
				</form>

				<div className="flex gap-4 mt-6">
					<button
						onClick={() => navigate('/')}
						className="text-black hover:text-white text-sm transition inline-flex items-center gap-1"
					>
						<ArrowLeft className="w-4 h-4" />
						Home
					</button>
					<button
						onClick={deleteAccount}
						className="text-black hover:text-white text-sm transition inline-flex items-center gap-1"
					>
						<Trash2 className="w-4 h-4" />
						DELETE ACCOUNT
					</button>
				</div>
			</div>
		</div>
	);
}

export default Profile;
