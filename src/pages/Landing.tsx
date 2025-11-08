import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Award, ArrowRight, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletConnect } from '@/components/WalletConnect';
import { useAuth } from '@/contexts/AuthContext';

export function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.div 
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 bg-primary/10 dark:bg-primary/20 shadow-soft"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <img 
              src="/spotme.svg" 
              alt="SpotMe" 
              className="w-12 h-12"
            />
          </motion.div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 bg-clip-text text-balance">
            SpotMe
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto text-balance leading-relaxed">
            Discover events, attend, and earn verified digital badges. 
            Build your portfolio with blockchain-verified event achievements.
          </p>

          {user ? (
            <Link to="/feed">
              <Button size="lg" className="text-lg px-10 py-7 shadow-glow hover:shadow-glow hover:scale-105 transition-all">
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
        <div className="mt-24 grid md:grid-cols-3 gap-8">
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
      whileHover={{ y: -4 }}
      className="bg-card rounded-2xl p-8 shadow-soft hover:shadow-elevated transition-all duration-300 border border-border"
    >
      <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-5 shadow-sm">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}

