import React from 'react';
import { Shield } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl py-12 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
                    <div className="flex items-center space-x-3">
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                            <Shield className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <span className="text-base font-bold text-slate-800 dark:text-slate-200">DomainScope</span>
                    </div>
                    <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 text-sm text-slate-500 dark:text-slate-400">
                        <span>© {new Date().getFullYear()} All rights reserved.</span>
                        <span className="hidden md:inline text-slate-300 dark:text-slate-700">•</span>
                        <span className="font-medium bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                            In Association With Kerala Police Cyberdome, Kozhikode
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-800">
                    <span>Developed by</span>
                    <a
                        href="https://www.linkedin.com/in/va1shnav"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 hover:underline"
                    >
                        Vaishnav K
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
