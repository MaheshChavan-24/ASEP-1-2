import { useAuth } from '../../hooks/useAuth';
import { motion } from 'motion/react';

export default function LandingPage() {
  const { signIn } = useAuth();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-bold text-gray-900 mb-8"
      >
        ServiceConnect
      </motion.h1>
      <p className="text-xl text-gray-600 mb-12">Hyper-Local Hybrid Gig & Bounty Platform</p>
      <button 
        onClick={signIn}
        className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Get Started
      </button>
    </div>
  );
}
