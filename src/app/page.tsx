export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <main className="flex flex-col items-center gap-6 text-center max-w-2xl">
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-7xl">
          BudgetBuddy
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300">
          Your personal finance tracker
        </p>
        
        <div className="mt-10 flex items-center justify-center gap-2 rounded-full bg-green-100 dark:bg-green-900/30 px-6 py-3 text-sm font-medium text-green-700 dark:text-green-300 ring-1 ring-inset ring-green-600/20">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          Setup complete ✅
        </div>
      </main>
    </div>
  );
}
