import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Award, Shield, Users, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletConnect } from '@/components/WalletConnect';
import { useAuth } from '@/contexts/AuthContext';

export function Landing() {
  const { connectWallet, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-6 shadow-lg">
            <Award className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Achievement Wallet
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Capture, verify, and showcase your achievements in a trusted and decentralized way. 
            Build your digital portfolio with blockchain-verified credentials.
          </p>

          {user ? (
            <Link to="/feed">
              <Button size="lg" className="text-lg px-8 py-6">
                Go to Feed
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          ) : (
            <div className="inline-block">
              <WalletConnect />
            </div>
          )}
        </motion.div>

        {/* Features Grid */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={Shield}
            title="Blockchain Verified"
            description="All achievements are verified on-chain using Sui blockchain, ensuring authenticity and immutability."
          />
          <FeatureCard
            icon={Users}
            title="Peer Verification"
            description="Friends can verify your achievements when you're not available, creating a trusted social network."
          />
          <FeatureCard
            icon={Zap}
            title="Skill Points & Rewards"
            description="Earn points for verified achievements and unlock new levels and badges as you grow."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
}

