import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BookOpen, Users, Heart, Lock, Sparkles, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-scrapbook.jpg";

const features = [
  {
    icon: BookOpen,
    title: "Page-by-Page",
    description: "Flip through memories like a real scrapbook with beautiful page-turn animations.",
  },
  {
    icon: Users,
    title: "Small Groups",
    description: "Share intimate moments with close friends & family, not the whole world.",
  },
  {
    icon: PenTool,
    title: "Creative Freedom",
    description: "Add photos, doodles, stickers, and voice notes. Arrange freely like a real diary.",
  },
  {
    icon: Heart,
    title: "Gentle Reactions",
    description: "React with love, not comments. Keep the space calm and meaningful.",
  },
  {
    icon: Lock,
    title: "Private by Default",
    description: "Every book is private. You choose who reads your story.",
  },
  {
    icon: Sparkles,
    title: "AI-Enhanced",
    description: "Smart titles, memory flashbacks, and summaries powered by AI.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-display text-2xl font-bold text-foreground">MemoryBook</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button variant="warm" size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="washi-tape inline-block mb-6 rounded-sm">
              <span className="text-sm font-body font-medium text-foreground">✨ A new way to remember</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight mb-6">
              Your memories,<br />
              <span className="text-primary">bound together.</span>
            </h1>
            <p className="text-lg text-muted-foreground font-body max-w-lg mb-8 leading-relaxed">
              MemoryBook is a private digital scrapbook where small groups create and preserve 
              memories together — page by page, like passing around a real diary.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/signup">
                <Button variant="hero">Start Your Book</Button>
              </Link>
              <Link to="/login">
                <Button variant="hero-outline">Sign In</Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="page-shadow rounded-lg overflow-hidden rotate-1 hover:rotate-0 transition-transform duration-500">
              <img
                src={heroImage}
                alt="A beautiful vintage scrapbook with polaroid photos and dried flowers"
                className="w-full h-auto rounded-lg"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 washi-tape rounded-sm animate-float">
              <span className="text-sm font-display text-foreground">memories last forever 💛</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-card">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              More than a photo album
            </h2>
            <p className="text-muted-foreground font-body text-lg max-w-2xl mx-auto">
              MemoryBook brings back the magic of physical diaries with the convenience of digital.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="paper-texture p-8 rounded-lg page-shadow hover:-translate-y-1 transition-transform duration-300"
              >
                <feature.icon className="h-8 w-8 text-accent mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground font-body leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="container mx-auto text-center paper-texture p-16 rounded-2xl page-shadow max-w-3xl"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Start preserving memories today
          </h2>
          <p className="text-muted-foreground font-body text-lg mb-8 max-w-xl mx-auto">
            Create your first Memory Book and invite the people who matter most.
          </p>
          <Link to="/signup">
            <Button variant="hero">Create Your First Book</Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-display text-xl text-foreground">MemoryBook</span>
          </div>
          <p className="text-sm text-muted-foreground font-body">
            © 2026 MemoryBook. Made with love for your memories.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
