import type { ReactNode } from 'react';

interface AuthLayoutProps {
	title: string;
	subtitle: string;
	error?: string | null;
	children: ReactNode;
	footer: ReactNode;
}

function AuthLayout({
	title,
	subtitle,
	error,
	children,
	footer,
}: AuthLayoutProps) {
	return (
		<div className="min-h-screen flex bg-[var(--csoc-paper)] text-[var(--csoc-ink)]">
			{/* Left panel background */}
			<section className="csoc-hatch relative hidden md:flex w-[52%] flex-col justify-between overflow-hidden p-12 text-white">
				<div
					className="pointer-events-none absolute -right-16 top-20 h-72 w-72 rounded-full opacity-30"
					style={{ background: 'var(--csoc-spot)' }}
					aria-hidden
				/>
				<div
					className="pointer-events-none absolute -bottom-24 left-10 h-80 w-80 rounded-full opacity-25"
					style={{ background: 'var(--csoc-accent)' }}
					aria-hidden
				/>

				<p className="csoc-fade font-display text-3xl font-extrabold tracking-tight relative">
					csoc
				</p>

				<div className="csoc-rise relative max-w-md">
					<h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight lg:text-6xl">
						Touch grass.
						<br />
						Meet people.
					</h1>
					<p className="mt-5 text-lg text-white/70 leading-relaxed">
						The place for students who want study buddies, events,
						and someone to sit next to in their labs every week without the awkwardness
						of having to navigate dead labs.
					</p>
				</div>

				<p className="csoc-fade relative text-sm text-white/45">
					Billy Wu 2026
				</p>
			</section>

			{/* Right panel */}
			<section className="flex w-full flex-col justify-center px-6 py-12 md:w-[48%] md:px-16">
				<div className="csoc-rise-delay mx-auto w-full max-w-sm">
					<p className="mb-8 font-display text-2xl font-extrabold tracking-tight md:hidden">
						csoc
					</p>

					<h2 className="font-display text-3xl font-bold tracking-tight">
						{title}
					</h2>
					<p className="mt-2 text-[var(--csoc-muted)]">{subtitle}</p>

					{error && (
						<div className="mt-6 border border-[var(--csoc-spot)]/30 bg-[var(--csoc-spot)]/8 px-4 py-3 text-sm text-[var(--csoc-spot)]">
							{error}
						</div>
					)}

					<div className="mt-8">{children}</div>

					<p className="mt-8 text-center text-sm text-[var(--csoc-muted)]">
						{footer}
					</p>
				</div>
			</section>
		</div>
	);
}

interface FieldProps {
	label: string;
	name: string;
	type?: string;
	placeholder?: string;
	autoComplete?: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Field({
	label,
	name,
	type = 'text',
	placeholder,
	autoComplete,
	onChange,
}: FieldProps) {
	return (
		<div className="flex flex-col gap-1.5">
			<label
				htmlFor={name}
				className="text-sm font-medium text-[var(--csoc-ink)]"
			>
				{label}
			</label>
			<input
				id={name}
				name={name}
				type={type}
				placeholder={placeholder}
				autoComplete={autoComplete}
				onChange={onChange}
				className="border border-[var(--csoc-line)] bg-white px-4 py-3 text-[var(--csoc-ink)] outline-none transition placeholder:text-[var(--csoc-muted)]/60 focus:border-[var(--csoc-accent)]"
			/>
		</div>
	);
}

export default AuthLayout;
