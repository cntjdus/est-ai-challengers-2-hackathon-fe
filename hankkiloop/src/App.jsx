function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
      <div className="text-center">
        <span className="mb-6 inline-block rounded-full border border-white/10 px-4 py-2 text-xs font-medium tracking-[0.2em] text-white/50">
          HACKATHON 2026
        </span>

        <h1 className="text-6xl font-bold tracking-tight sm:text-8xl">
          14조
        </h1>

        <p className="mt-5 text-base font-medium text-white/50 sm:text-lg">
          EST AI Challengers 2기
        </p>

        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-white/40">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
          Development in progress
        </div>
      </div>
    </main>
  );
}

export default App;