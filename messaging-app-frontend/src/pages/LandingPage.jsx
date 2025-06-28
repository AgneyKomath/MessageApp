import { Link } from "react-router-dom";

export default function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Hero */}
            <header className="flex-grow bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center">
                <div className="container mx-auto px-6 py-16 text-white">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">Welcome to Agney's Chat App</h1>
                    <p className="mb-8 text-lg md:text-xl max-w-2xl">
                        Real-time messaging made simple. Connect with friends and family instantly, on desktop or mobile.
                    </p>
                    <div className="space-x-4">
                        <Link
                            to="/auth/register"
                            className="inline-block bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg shadow hover:bg-gray-100 transition"
                        >
                            Get Started
                        </Link>
                        <Link
                            to="/auth/login"
                            className="inline-block border border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition"
                        >
                            Log In
                        </Link>
                    </div>
                </div>
            </header>
        </div>
    );
}
