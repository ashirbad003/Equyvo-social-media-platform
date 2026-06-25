import React, { useEffect, useState, useRef } from 'react';

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingText, setLoadingText] = useState('Initializing...');
    const onFinishRef = useRef(onFinish);

    // Update ref when onFinish changes
    useEffect(() => {
        onFinishRef.current = onFinish;
    }, [onFinish]);

    const loadingSteps = [
        { progress: 20, text: 'Loading components...' },
        { progress: 40, text: 'Connecting to services...' },
        { progress: 60, text: 'Preparing your experience...' },
        { progress: 80, text: 'Almost ready...' },
        { progress: 100, text: 'Welcome to Equyvo!' }
    ];

    useEffect(() => {
        const totalDuration = 1500; // Reduced to 1.5 seconds total
        const stepDuration = totalDuration / loadingSteps.length;

        loadingSteps.forEach((step, index) => {
            setTimeout(() => {
                setLoadingProgress(step.progress);
                setLoadingText(step.text);
            }, index * stepDuration);
        });

        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onFinishRef.current(), 300); // Reduced fade time to 300ms
        }, totalDuration + 300);

        return () => clearTimeout(timer);
    }, []); // Empty dependency array - only run once

    if (!isVisible) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-black via-blue-900/50 to-black transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 bg-cyan-400/60 rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 3}s`
                        }}
                    />
                ))}
            </div>

            <div className="relative flex flex-col items-center justify-center">
                {/* Logo with enhanced animation */}
                <div className="relative mb-8">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.5)] animate-bounce">
                        <img
                            src="/Equyvo_logo.png"
                            alt="Equyvo Logo"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/30 to-blue-500/30 animate-pulse" />
                </div>

                {/* App name with gradient text */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-400 mb-6 animate-pulse leading-[2.5] py-6 px-4" style={{ fontFamily: "'Pacifico', cursive", overflow: 'visible' }}>
                    equyvo
                </h1>

                {/* Loading progress bar */}
                <div className="w-64 sm:w-80 h-2 bg-gray-700/50 rounded-full overflow-hidden mb-4 backdrop-blur-sm">
                    <div 
                        className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                        style={{ width: `${loadingProgress}%` }}
                    >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    </div>
                </div>

                {/* Loading text */}
                <p className="text-cyan-300 text-sm sm:text-base animate-pulse text-center">
                    {loadingText}
                </p>

                {/* Platform-specific indicator */}
                <div className="mt-8 flex items-center gap-2 text-cyan-400 text-xs">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                    <span>Optimized for your device</span>
                </div>
            </div>

            {/* Add custom animation styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes shimmer {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                    .animate-shimmer {
                        animation: shimmer 2s infinite;
                    }
                `
            }} />
        </div>
    );
};

export default SplashScreen;
