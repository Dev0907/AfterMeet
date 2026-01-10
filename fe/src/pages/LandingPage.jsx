import React from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardHero from '../assets/dashboard_hero.png';
import landingAbout from '../assets/landing_about.png';
import landingServicesIcon from '../assets/landing_services_icon.png';
import dashboardStatIcon from '../assets/dashboard_stat_icon.png';

const LandingPage = () => {
    const navigate = useNavigate();

    // Navigation scroll helper
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-neo-white)] font-sans text-black">

            {/* Navigation Bar */}
            <nav className="fixed top-0 left-0 w-full bg-white border-b-4 border-black z-50 flex justify-between items-center px-6 py-4">
                <div className="text-2xl font-black tracking-tighter uppercase cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                    AfterMeet
                </div>
                <div className="hidden md:flex gap-8 font-bold text-lg">
                    <button onClick={() => scrollToSection('home')} className="hover:text-[var(--color-neo-blue)] uppercase">Home</button>
                    <button onClick={() => scrollToSection('about')} className="hover:text-[var(--color-neo-blue)] uppercase">About</button>
                    <button onClick={() => scrollToSection('services')} className="hover:text-[var(--color-neo-blue)] uppercase">Services</button>
                    <button onClick={() => scrollToSection('contact')} className="hover:text-[var(--color-neo-blue)] uppercase">Contact</button>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/signin')} className="font-bold border-2 border-transparent hover:border-black px-4 py-2 transition-all">
                        Login
                    </button>
                    <button onClick={() => navigate('/signup')} className="font-black bg-[var(--color-neo-yellow)] border-2 border-black px-6 py-2 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all">
                        Get Started
                    </button>
                </div>
            </nav>

            {/* HOME / HERO Section */}
            <section id="home" className="pt-32 pb-20 px-6 min-h-screen flex flex-col items-center justify-center bg-[var(--color-neo-white)]">
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="order-2 lg:order-1">
                        <h1 className="text-6xl md:text-8xl font-black uppercase leading-[0.9] mb-8">
                            Meetings <br />
                            <span className="text-[var(--color-neo-blue)]">Redefined.</span>
                        </h1>
                        <p className="text-xl md:text-2xl font-bold mb-10 border-l-8 border-black pl-6">
                            Turn your chaotic meeting notes into actionable insights with AI-powered analytics.
                        </p>
                        <button onClick={() => navigate('/signup')} className="text-2xl font-black bg-[var(--color-neo-red)] border-4 border-black px-10 py-4 shadow-[8px_8px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#000] transition-all">
                            Start for Free
                        </button>
                    </div>
                    <div className="order-1 lg:order-2">
                        <img src={dashboardHero} alt="Hero" className="w-full border-4 border-black shadow-[8px_8px_0px_0px_var(--color-neo-teal)] bg-white p-4" />
                    </div>
                </div>
            </section>

            {/* ABOUT Section */}
            <section id="about" className="py-24 px-6 bg-[var(--color-neo-teal)] border-y-4 border-black">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <img src={landingAbout} alt="About Us" className="w-full border-4 border-black shadow-[8px_8px_0px_0px_#000] bg-white" />
                    </div>
                    <div>
                        <h2 className="text-5xl md:text-6xl font-black uppercase mb-8 bg-white inline-block px-4 border-4 border-black transform -rotate-2">
                            Who We Are
                        </h2>
                        <p className="text-xl font-bold mb-6">
                            We are a team of builders, dreamers, and meeting-haters. We believe that collaboration should be messy, fun, and productive.
                        </p>
                        <p className="text-xl font-bold mb-6">
                            AfterMeet was born from the frustration of lost action items and forgotten decisions. We built a tool that captures the chaos and turns it into structure.
                        </p>
                        <div className="p-6 bg-[var(--color-neo-yellow)] border-4 border-black shadow-[4px_4px_0px_0px_#000]">
                            <p className="font-black text-2xl">"No more boring meetings."</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SERVICES Section */}
            <section id="services" className="py-24 px-6 bg-[var(--color-neo-white)]">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-5xl md:text-6xl font-black uppercase mb-16 text-center">
                        <span className="border-b-8 border-[var(--color-neo-red)]">Our Services</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Service 1 */}
                        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] hover:-translate-y-2 transition-transform">
                            <img src={landingServicesIcon} alt="Service" className="w-20 h-20 mb-6" />
                            <h3 className="text-3xl font-black uppercase mb-4">AI Transcripts</h3>
                            <p className="font-bold text-gray-700">
                                Automatically transcribe every word. Never miss a detail again.
                            </p>
                        </div>
                        {/* Service 2 */}
                        <div className="bg-[var(--color-neo-yellow)] border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] hover:-translate-y-2 transition-transform">
                            <img src={dashboardStatIcon} alt="Analytics" className="w-20 h-20 mb-6" />
                            <h3 className="text-3xl font-black uppercase mb-4">Smart Analytics</h3>
                            <p className="font-bold text-gray-700">
                                Visualize team performance and meeting efficiency with bold charts.
                            </p>
                        </div>
                        {/* Service 3 */}
                        <div className="bg-[var(--color-neo-red)] border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] hover:-translate-y-2 transition-transform">
                            <div className="w-20 h-20 flex items-center justify-center bg-black text-white font-black text-4xl mb-6 border-4 border-white">
                                AI
                            </div>
                            <h3 className="text-3xl font-black uppercase mb-4">Action Items</h3>
                            <p className="font-bold text-white">
                                Automatically extract action items and assign them to your team.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CONTACT Section */}
            <section id="contact" className="py-24 px-6 bg-black text-[var(--color-neo-white)] border-t-4 border-black">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-5xl md:text-6xl font-black uppercase mb-8 text-[var(--color-neo-yellow)]">
                        Get In Touch
                    </h2>
                    <p className="text-xl font-bold mb-12 max-w-2xl mx-auto">
                        Have questions? Want to complain about your last meeting? We're all ears.
                    </p>

                    <form className="bg-[var(--color-neo-white)] p-8 border-4 border-[var(--color-neo-blue)] shadow-[8px_8px_0px_0px_var(--color-neo-blue)] text-black text-left grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="font-black uppercase">Name</label>
                            <input type="text" className="border-4 border-black p-3 font-bold focus:outline-none focus:ring-4 focus:ring-[var(--color-neo-yellow)]" placeholder="YOUR NAME" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-black uppercase">Email</label>
                            <input type="email" className="border-4 border-black p-3 font-bold focus:outline-none focus:ring-4 focus:ring-[var(--color-neo-yellow)]" placeholder="YOUR EMAIL" />
                        </div>
                        <div className="flex flex-col gap-2 md:col-span-2">
                            <label className="font-black uppercase">Message</label>
                            <textarea rows="4" className="border-4 border-black p-3 font-bold focus:outline-none focus:ring-4 focus:ring-[var(--color-neo-yellow)]" placeholder="TELL US EVERYTHING"></textarea>
                        </div>
                        <div className="md:col-span-2">
                            <button type="button" className="w-full bg-[var(--color-neo-blue)] text-white font-black uppercase py-4 border-4 border-black hover:bg-[var(--color-neo-dark)] transition-colors">
                                Send Message
                            </button>
                        </div>
                    </form>

                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 bg-white border-t-4 border-black text-center font-bold">
                <p>&copy; {new Date().getFullYear()} AfterMeet. Brutally simple.</p>
            </footer>

        </div>
    );
};

export default LandingPage;
