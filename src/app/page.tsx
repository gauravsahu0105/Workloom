import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-20">
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-8">
        <h1 className="text-3xl font-bold text-slate-100">Workloom</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          Create projects, manage team members, assign tasks, and track progress with role-based access
          (Admin/Member).
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-800 p-4">
            <h2 className="font-semibold text-slate-100">Authentication</h2>
            <p className="mt-1 text-sm text-slate-400">Secure signup/login with JWT and hashed passwords.</p>
          </div>
          <div className="rounded-lg border border-slate-800 p-4">
            <h2 className="font-semibold text-slate-100">Role-Based Access</h2>
            <p className="mt-1 text-sm text-slate-400">Admins create projects and invite members.</p>
          </div>
          <div className="rounded-lg border border-slate-800 p-4">
            <h2 className="font-semibold text-slate-100">Task Tracking</h2>
            <p className="mt-1 text-sm text-slate-400">Status workflow: TODO, IN_PROGRESS, DONE.</p>
          </div>
          <div className="rounded-lg border border-slate-800 p-4">
            <h2 className="font-semibold text-slate-100">Dashboard Metrics</h2>
            <p className="mt-1 text-sm text-slate-400">Total, in progress, completed, and overdue tasks.</p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="mt-8 inline-flex rounded-md bg-sky-500 px-4 py-2 font-medium text-slate-950 hover:bg-sky-400"
        >
          Open App
        </Link>
      </div>
    </main>
  );
}
