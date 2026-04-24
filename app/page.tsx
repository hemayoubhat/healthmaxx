export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-green-400">HealthMaxx</h1>
        <p className="mt-4 text-gray-400 text-lg">
          AI-powered diet & workout plans — built on science.
        </p>
        <button className="mt-8 bg-green-500 hover:bg-green-400 text-black font-bold py-3 px-8 rounded-xl">
          Get My Plan →
        </button>
      </div>
    </main>
  );
}