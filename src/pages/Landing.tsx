import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Award, ArrowRight, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletConnect } from '@/components/WalletConnect';
import { useAuth } from '@/contexts/AuthContext';

export function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6">
            <img 
              src="/spotme.svg" 
              alt="SpotMe" 
              className="w-full h-full"
            />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            SpotMe
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover events, attend, and earn verified digital badges. 
            Build your portfolio with blockchain-verified event achievements.
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
            icon={Calendar}
            title="Discover Local Events"
            description="Find and join events near you. Browse upcoming events, register with QR codes or event codes, and never miss an opportunity."
          />
          <FeatureCard
            icon={CheckCircle}
            title="Verify Your Attendance"
            description="Location-based verification ensures authenticity. Take a photo at the event with GPS and timestamp verification for fraud prevention."
          />
          <FeatureCard
            icon={Award}
            title="Earn Blockchain Badges"
            description="Receive soulbound NFT badges as proof of attendance. Build your verified portfolio of event achievements on the Sui blockchain."
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
      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-[#ff3800]" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
}

