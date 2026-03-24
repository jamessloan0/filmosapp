import React, { useState, useEffect, useRef } from "react";
import { supabase } from '@/api/supabaseClient';
import LoginModal from '@/components/LoginModal';
import { entities } from '@/api/entities';
import { invoke } from '@/api/functions';
import { useNavigate } from "react-router-dom";
import {
  Film, MessageSquareText, FolderKanban, HardDrive,
  GitBranch, CheckCircle2, ChevronRight, Heart,
  Loader2, Send, FileText, Receipt, Menu, X, ArrowDown
} from "lucide-react";

const FEATURES = [
  { icon: MessageSquareText, title: "Timeline Comments", desc: "Clients leave feedback at exact timestamps — no more confusing email threads.", color: "text-sky-500", bg: "bg-sky-50" },
  { icon: FolderKanban, title: "Project Collaboration", desc: "All communication between filmmaker and client in one organized workspace.", color: "text-violet-500", bg: "bg-violet-50" },
  { icon: FileText, title: "Proposals", desc: "Send beautiful proposals that clients can approve or request changes on.", color: "text-blue-500", bg: "bg-blue-50" },
  { icon: Receipt, title: "Invoicing", desc: "Create and send invoices directly from your project. Track payments instantly.", color: "text-emerald-500", bg: "bg-emerald-50" },
  { icon: GitBranch, title: "Version History", desc: "Upload multiple drafts and keep a clean record of every revision.", color: "text-amber-500", bg: "bg-amber-50" },
  { icon: HardDrive, title: "File Delivery", desc: "Upload and share high-quality exports with secure, private download links.", color: "text-rose-500", bg: "bg-rose-50" },
];

const STEPS = [
  { n: "01", title: "Create a Project", desc: "Invite your client and upload your first draft in minutes." },
  { n: "02", title: "Send a Proposal", desc: "Share a professional proposal for client approval before you begin." },
  { n: "03", title: "Collaborate on Edits", desc: "Clients review videos and leave timestamp-precise comments." },
  { n: "04", title: "Invoice & Deliver", desc: "Send an invoice and deliver the final video with a secure download link." },
];

function WaitlistForm({ source, dark = false, onSuccess, shared }) {
  const { email, setEmail, submitting, done, handleSubmit } = shared;

  if (done) {
    return (
      <div className={`inline-flex items-center gap-2 font-semibold px-6 py-4 rounded-2xl text-base ${dark ? "bg-emerald-500/20 border border-emerald-400/40 text-emerald-300" : "bg-emerald-50 border border-emerald-200 text-emerald-700"}`}>
        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
        You're on the list — we'll be in touch!
      </div>
    );
  }

  return (
    <form onSubmit={(e) => handleSubmit(e, source)} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-md mx-auto">
      <input
        id={source === "hero" ? "hero-email" : undefined}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email address"
        className={`flex-1 px-5 py-4 rounded-2xl border text-sm outline-none transition-colors ${
          dark
            ? "border-zinc-700 bg-zinc-800 text-white placeholder-zinc-500 focus:border-sky-500"
            : "border-zinc-200 bg-white text-zinc-900 placeholder-zinc-400 focus:border-sky-400 shadow-sm"
        }`}
      />
      <button
        type="submit"
        disabled={submitting}
        className={`flex items-center justify-center gap-2 font-semibold px-7 py-4 rounded-2xl text-sm transition-all duration-200 whitespace-nowrap disabled:opacity-60 shadow-lg ${
          dark
            ? "bg-white hover:bg-zinc-100 text-zinc-900"
            : "bg-zinc-900 hover:bg-zinc-700 text-white"
        }`}
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Join Waitlist</>}
      </button>
    </form>
  );
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const heroRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) setUser({ email: session.user.email });
  });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSubmit = async (e, source = "hero") => {
    e?.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await entities.WaitlistEmail.create({ email: email.trim(), source });
      setDone(true);
      setEmail("");
    } catch (_) {}
    setSubmitting(false);
  };

  const [showLogin, setShowLogin] = useState(false);
  const goToLogin = () => setShowLogin(true);

  const scrollToHero = () => {
    heroRef.current?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => document.getElementById("hero-email")?.focus(), 600);
  };

  const shared = { email, setEmail, submitting, done, handleSubmit };

  return (
    <div className="min-h-screen bg-white text-zinc-900 overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-zinc-100" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-5 h-15 flex items-center justify-between py-3">
          <a href="#" className="flex items-center gap-2">
            <img src="https://media.base44.com/images/public/69b490115c68bd1fe6d609a8/19ed2b1d5_filmOSlogomain-removebg-preview.png" alt="FilmOS" className="h-7 w-auto" />
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Features</a>
            <a href="#how" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">How it works</a>
            <a href="#pricing" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Pricing</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={goToLogin} className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors px-4 py-2">Log in</button>
            <button onClick={scrollToHero} className="text-sm font-semibold bg-zinc-900 text-white px-5 py-2 rounded-xl hover:bg-zinc-700 transition-colors shadow-sm">Join Waitlist</button>
          </div>
          <div className="md:hidden flex items-center gap-2">
            <button onClick={scrollToHero} className="text-xs font-semibold bg-zinc-900 text-white px-4 py-2 rounded-xl">Join Waitlist</button>
            <button className="p-2" onClick={() => setMenuOpen(o => !o)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-zinc-100 px-6 py-4 space-y-3">
            <a href="#features" className="block text-sm text-zinc-600 py-2" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how" className="block text-sm text-zinc-600 py-2" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#pricing" className="block text-sm text-zinc-600 py-2" onClick={() => setMenuOpen(false)}>Pricing</a>
            <button onClick={goToLogin} className="block w-full text-sm font-medium border border-zinc-200 rounded-xl px-4 py-2.5 text-center">Log in</button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative pt-28 pb-20 px-5 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-sky-50 via-violet-50/40 to-transparent rounded-full blur-3xl opacity-70" />
        </div>

        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-zinc-200 rounded-full px-4 py-1.5 mb-6 shadow-sm">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span className="text-xs font-medium text-zinc-600">Made by filmmakers, for filmmakers</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-zinc-900 mb-5 leading-[1.05]">
            Client Work,<br />
            <span className="bg-gradient-to-r from-sky-500 to-violet-500 bg-clip-text text-transparent">
              Finally Simple.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-500 max-w-xl mx-auto mb-4 leading-relaxed">
            Proposals, video feedback, invoicing, and file delivery — all in one place built for filmmakers.
          </p>

          {/* Social proof nudge */}
          <p className="text-sm text-zinc-400 mb-8 font-medium">
            🎬 Join filmmakers getting early access — <span className="text-zinc-600">no spam, ever.</span>
          </p>

          {/* HERO WAITLIST FORM */}
          <div className="bg-white/70 backdrop-blur-sm border border-zinc-100 rounded-3xl p-5 sm:p-6 shadow-xl max-w-md mx-auto mb-4">
            <p className="text-sm font-semibold text-zinc-700 mb-3 text-center">Get early access to FilmOS</p>
            <WaitlistForm source="hero" shared={shared} />
            <p className="text-xs text-zinc-400 mt-3 text-center">Free forever plan included. No credit card needed.</p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
            <span>See what's included</span>
          </div>
        </div>
      </section>

      {/* ── FILMMAKER CALLOUT ── */}
      <section className="py-14 px-5 bg-zinc-900">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-zinc-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            <span className="text-white font-semibold">We're filmmakers too.</span> We got tired of sending proposals over email, chasing invoice payments, and getting feedback like "you know, the part around 2 minutes." FilmOS is the platform we built for ourselves — and now we're sharing it.
          </p>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 px-5 bg-zinc-50/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-sky-500 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 tracking-tight">
              Everything from pitch<br className="hidden sm:block" /> to final delivery
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex gap-4">
                <div className={`w-10 h-10 ${f.bg} rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mid-page CTA */}
          <div className="mt-12 text-center">
            <p className="text-zinc-500 mb-4 text-sm">Sounds good? Get early access.</p>
            <button onClick={scrollToHero} className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 text-white font-semibold px-7 py-3.5 rounded-2xl text-sm shadow-lg transition-all">
              <Send className="w-4 h-4" /> Join the Waitlist
            </button>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-violet-500 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 tracking-tight">
              From first pitch<br className="hidden sm:block" /> to final delivery
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex sm:flex-col items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center text-sm font-bold shadow-md flex-shrink-0">
                  {s.n}
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 text-base mb-1">{s.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 px-5 bg-zinc-50/60">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-semibold text-emerald-500 uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight mb-3">Simple, honest pricing</h2>
          <p className="text-zinc-500 mb-10 text-sm">Start free. Upgrade when you're ready.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
            {/* Free */}
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 pt-6 pb-5 flex-1">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Free</p>
                <p className="text-3xl font-bold text-zinc-900 mb-1">$0 <span className="text-base font-normal text-zinc-400">/ month</span></p>
                <p className="text-sm text-zinc-400 mb-5">Try FilmOS with your first project.</p>
                <ul className="space-y-2.5">
                  {["1 project", "1 invoice per month", "Video review & comments", "Proposals", "File uploads up to 2 GB"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-zinc-600">
                      <CheckCircle2 className="w-4 h-4 text-zinc-400 flex-shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-6 pb-6">
                <button onClick={scrollToHero} className="w-full border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-semibold py-3 rounded-2xl text-sm transition-colors">
                  Join Waitlist
                </button>
              </div>
            </div>

            {/* Pro */}
            <div className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-xl overflow-hidden flex flex-col relative">
              <div className="absolute top-4 right-4">
                <span className="text-xs font-semibold bg-sky-500 text-white px-2.5 py-1 rounded-full">Popular</span>
              </div>
              <div className="px-6 pt-6 pb-5 flex-1">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Pro</p>
                <p className="text-sm text-zinc-400 mb-5">For filmmakers running a real business.</p>
                <ul className="space-y-2.5">
                  {["Unlimited projects", "Unlimited clients", "Unlimited invoices", "File uploads up to 20 GB", "Priority support"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-6 pb-6">
                <button onClick={scrollToHero} className="w-full bg-white hover:bg-zinc-100 text-zinc-900 font-semibold py-3 rounded-2xl text-sm transition-colors shadow-md">
                  Join Waitlist
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-10 sm:p-14 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
            <h2 className="relative text-2xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
              Run your film business<br className="hidden sm:block" /> like a pro.
            </h2>
            <p className="relative text-zinc-400 mb-8 text-sm sm:text-base">
              Join filmmakers who use FilmOS to win more clients and deliver work they're proud of.
            </p>
            <div className="relative">
              <WaitlistForm source="cta" dark shared={shared} />
            </div>
            <p className="relative text-xs text-zinc-600 mt-4">No spam. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-100 py-10 px-5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex flex-col items-center md:items-start gap-2">
            <img src="https://media.base44.com/images/public/69b490115c68bd1fe6d609a8/19ed2b1d5_filmOSlogomain-removebg-preview.png" alt="FilmOS" className="h-7 w-auto" />
            <p className="text-xs text-zinc-400 text-center md:text-left max-w-xs">Proposals, collaboration, invoicing, and delivery — all in one place.</p>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={goToLogin} className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Log in</button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-7 pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-400">© {new Date().getFullYear()} FilmOS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="/Terms" className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">Terms</a>
            <a href="/Privacy" className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}