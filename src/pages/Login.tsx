import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AuthLayout, { Field } from '../components/AuthLayout';

function Login() {
	const navigate = useNavigate();
	const [form, setForm] = useState({ email: '', password: '' });
	const [error, setError] = useState<string | null>(null);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const res = await axios.post('/login', form);
			localStorage.setItem('token', res.data.token);
			navigate('/');
		} catch {
			setError('Invalid email or password');
		}
	};

	return (
		<AuthLayout
			title="Log in"
			subtitle="Welcome back and keep exploring."
			error={error}
			footer={
				<>
					No account?{' '}
					<Link
						to="/signup"
						className="font-semibold text-[var(--csoc-accent)] underline-offset-4 hover:underline"
					>
						Sign up
					</Link>
				</>
			}
		>
			<form
				onSubmit={handleSubmit}
				className="flex flex-col gap-4"
			>
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
					autoComplete="current-password"
					onChange={handleChange}
				/>
				<button
					type="submit"
					className="mt-2 bg-[var(--csoc-accent)] py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--csoc-accent-hover)]"
				>
					Log in
				</button>
			</form>
		</AuthLayout>
	);
}

export default Login;
