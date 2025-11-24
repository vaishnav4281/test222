import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Shield, Globe, Activity, Share2, Mail, Lock, User, Sun, Moon } from 'lucide-react';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isDark, setIsDark] = useState(true);
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const initialDark = savedTheme ? savedTheme === 'dark' : true;
        setIsDark(initialDark);
        document.documentElement.classList.toggle('dark', initialDark);
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        document.documentElement.classList.toggle('dark', newTheme);
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3001/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (res.ok) {
                login(data.token, data.user);
                toast.success('Account created successfully!');
                navigate('/');
            } else {
                toast.error(data.error || 'Signup failed');
            }
        } catch (error) {
            toast.error('Something went wrong');
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#0B0F19] dark:to-[#0f1419] text-slate-900 dark:text-white overflow-hidden relative transition-colors duration-300">
            {/* Background Grid & Glows */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f293720_1px,transparent_1px),linear-gradient(to_bottom,#1f293720_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-transparent to-red-500/5 dark:from-blue-900/10 dark:via-transparent dark:to-red-900/10" />
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-red-400/10 dark:bg-red-600/20 rounded-full blur-3xl" />
            </div>

            {/* Theme Toggle - Top Right */}
            <button
                onClick={toggleTheme}
                className="absolute top-8 right-8 z-50 p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm"
                aria-label="Toggle theme"
            >
                {isDark ? (
                    <Sun className="h-5 w-5 text-amber-500" />
                ) : (
                    <Moon className="h-5 w-5 text-indigo-600" />
                )}
            </button>

            {/* Left Panel - Feature Highlights */}
            <div className="hidden lg:flex w-1/2 flex-col justify-center px-20 relative z-10">
                <div className="mb-16">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="bg-gradient-to-br from-blue-600 to-red-600 p-4 rounded-2xl shadow-2xl shadow-blue-500/30 dark:shadow-blue-500/20">
                            <Shield className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
                            DomainScope
                        </h1>
                    </div>
                    <p className="text-2xl text-slate-600 dark:text-slate-400 font-light tracking-wide">
                        Advanced OSINT Intelligence Platform
                    </p>
                </div>

                <div className="space-y-10 max-w-lg">
                    <div className="flex items-start gap-5 group cursor-pointer">
                        <div className="p-4 rounded-xl bg-blue-500/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20 dark:group-hover:bg-blue-500/20 transition-all duration-300 shadow-lg">
                            <Globe className="h-7 w-7" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-slate-800 dark:text-slate-200 mb-2">Domain Intelligence</h3>
                            <p className="text-slate-600 dark:text-slate-500 text-sm leading-relaxed">
                                Real-time threat analysis and reputation scoring for any domain with comprehensive insights.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-5 group cursor-pointer">
                        <div className="p-4 rounded-xl bg-red-500/10 dark:bg-red-500/10 text-red-600 dark:text-red-400 group-hover:bg-red-500/20 dark:group-hover:bg-red-500/20 transition-all duration-300 shadow-lg">
                            <Activity className="h-7 w-7" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-slate-800 dark:text-slate-200 mb-2">Live Monitoring</h3>
                            <p className="text-slate-600 dark:text-slate-500 text-sm leading-relaxed">
                                Server-Sent Events for real-time updates, instant alerts, and comprehensive scan tracking.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-5 group cursor-pointer">
                        <div className="p-4 rounded-xl bg-purple-500/10 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500/20 dark:group-hover:bg-purple-500/20 transition-all duration-300 shadow-lg">
                            <Share2 className="h-7 w-7" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-slate-800 dark:text-slate-200 mb-2">Graph Intelligence</h3>
                            <p className="text-slate-600 dark:text-slate-500 text-sm leading-relaxed">
                                Advanced algorithms for threat pivoting, relationship mapping, and infrastructure analysis.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-16 text-sm text-slate-500 dark:text-slate-600">
                    Built by <span className="font-semibold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">Vaishnav K</span>
                </div>
            </div>

            {/* Right Panel - Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative z-10">
                <div className="w-full max-w-[480px]">
                    {/* Mobile Logo - Visible only on small screens */}
                    <div className="lg:hidden flex flex-col items-center mb-8">
                        <div className="bg-gradient-to-br from-blue-600 to-red-600 p-3 rounded-xl shadow-lg shadow-blue-500/30 mb-4">
                            <Shield className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
                            DomainScope
                        </h1>
                    </div>

                    {/* Card Container */}
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10">
                        <div className="text-center mb-8 sm:mb-10">
                            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">Create Account</h2>
                            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                                Join the intelligence platform today
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-5">
                                <div className="relative group">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <Input
                                            type="text"
                                            placeholder="John Doe"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="pl-12 h-14 bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20 rounded-xl transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="relative group">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-red-600 dark:group-focus-within:text-red-500 transition-colors" />
                                        </div>
                                        <Input
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-12 h-14 bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-red-600 dark:focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:focus:ring-red-500/20 rounded-xl transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="relative group">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <Input
                                            type="password"
                                            placeholder="Create a strong password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-12 h-14 bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20 rounded-xl transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-14 bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-500 hover:to-red-500 text-white font-bold text-base rounded-xl shadow-xl shadow-red-500/30 dark:shadow-red-900/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                            >
                                Create Your Account
                            </Button>
                        </form>

                        <div className="text-center text-sm text-slate-600 dark:text-slate-400 mt-8">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold hover:underline transition-all"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
