import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AuthLayout, { Field } from '../components/AuthLayout';

function Signup() {
	const navigate = useNavigate();
	const [form, setForm] = useState({ username: '', email: '', password: '' });
	const [error, setError] = useState<string | null>(null);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await axios.post('http://localhost:8000/users', form);
			navigate('/login');
		} catch (err) {
			if (axios.isAxiosError(err) && err.response?.data?.detail) {
				setError(err.response.data.detail);
			} else {
				setError('Email or username may be unavailable.');
			}
		}
	};

	return (
		<AuthLayout
			title="Join csoc"
			subtitle="A minute of form filling, a lifetime of memories."
			error={error}
			footer={
				<>
					Already have an account?{' '}
					<Link
						to="/login"
						className="font-semibold text-[var(--csoc-accent)] underline-offset-4 hover:underline"
					>
						Log in
					</Link>
				</>
			}
		>
			<form
				onSubmit={handleSubmit}
				className="flex flex-col gap-4"
			>
				<Field
					label="Username"
					name="username"
					placeholder="username"
					autoComplete="username"
					onChange={handleChange}
				/>
				<Field
					label="Email"
					name="email"
					type="email"
					placeholder="yourname@email.com"
					autoComplete="email"
					onChange={handleChange}
				/>
				<Field
					label="Password"
					name="password"
					type="password"
					placeholder="••••••••"
					autoComplete="new-password"
					onChange={handleChange}
				/>
				<button
					type="submit"
					className="mt-2 bg-[var(--csoc-accent)] py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--csoc-accent-hover)]"
				>
					Create account
				</button>
			</form>
		</AuthLayout>
	);
}

export default Signup;
