import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Anchor,
  ArrowRight,
  Users,
  BarChart3,
  Shield,
  Store,
  ShoppingBag,
} from "lucide-react";
import { siInstagram, siX, siFacebook } from "simple-icons";

function SocialIcon({ icon }: { icon: any }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4 fill-current"
      aria-hidden="true"
    >
      <path d={icon.path} />
    </svg>
  );
}

type FeatureCardProps = {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
};

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => (
  <div className="bg-slate-100 rounded-2xl p-6 md:p-8 h-full transition-all duration-300 hover:bg-slate-150 hover:scale-105">
    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
      <Icon className="w-6 h-6 text-white" strokeWidth={2} />
    </div>
    <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-3">
      {title}
    </h3>
    <p className="text-base text-slate-600 leading-relaxed">{description}</p>
  </div>
);
const LandingPage = () => {
  const features = [
    {
      icon: Users,
      title: "Vendor management",
      description:
        "Approve applications, manage vendor accounts, and oversee marketplace participants.",
    },
    {
      icon: BarChart3,
      title: "Real-time analytics",
      description:
        "Track sales, monitor inventory, and access comprehensive trade data instantly.",
    },
    {
      icon: Shield,
      title: "Secure operations",
      description:
        "Role-based access control with audit logs for complete transparency.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header
        className="top-0 fixed w-full bg-white/90 backdrop-blur-md shadow-sm z-50"
        data-aos="fade-down"
        data-aos-duration="500"
        data-aos-offset="0"
        data-aos-once="true"
      >
        <div className="container max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          {/* Left: Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer group"
            data-aos="fade-down"
            data-aos-delay="50"
            data-aos-once="true"
          >
            <Anchor className="w-5 h-5 text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />

            <span className="text-base md:text-lg font-semibold heading-font tracking-widest text-primary">
              MARINA
            </span>
          </div>

          {/* Right: Nav + Login */}
          <div
            className="hidden md:flex items-center gap-8 md:gap-10"
            data-aos="fade-down"
            data-aos-delay="100"
            data-aos-once="true"
          >
            <nav className="flex items-center gap-6 md:gap-8 text-base text-slate-600">
              {["App", "Features", "Contact"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="relative transition-all duration-300 hover:text-primary after:absolute after:left-0 after:-bottom-1.5 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                >
                  {item}
                </a>
              ))}
            </nav>

            <Link to="/login">
              <Button className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="app"
        className="scroll-mt-20 relative mt-16 min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 md:px-6 flex items-center"
      >
        <div className="container mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center relative z-10">
          {/* Left: Text */}
          <div className="text-center lg:text-left space-y-4 md:space-y-6">
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary leading-tight"
              data-aos="fade-up"
            >
              Marketplace for
              <span className="text-primary"> Aquatic Retail </span>
              and Instant Network Access
            </h1>

            <p
              className="text-base md:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              Access live seafood listings directly from local aquatic vendors.
            </p>

            <div
              className="flex flex-col sm:flex-row items-center lg:items-start gap-4 pt-4 md:pt-6"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <a
                href="#"
                aria-label="Download on the App Store"
                className="transition-transform duration-300 hover:scale-105 hover:shadow-xl"
              >
                <img
                  src="/app-store-icon.svg"
                  alt="Download on the App Store"
                  className="h-12 md:h-14 w-auto"
                />
              </a>

              <a
                href="#"
                aria-label="Get it on Google Play"
                className="transition-transform duration-300 hover:scale-105 hover:shadow-xl"
              >
                <img
                  src="/google-play.svg"
                  alt="Get it on Google Play"
                  className="h-12 md:h-14 w-auto"
                />
              </a>
            </div>
          </div>

          {/* Right: Mobile App Image */}
          <div className="relative hidden lg:block h-150">
            <div
              className="absolute inset-0 bg-linear-to-tr from-primary/20 to-blue-500/20 rounded-full blur-3xl"
              data-aos="zoom-in"
              data-aos-delay="400"
            />

            <img
              src="/img/app.png"
              alt="MARINA Mobile App"
              className="absolute right-0 w-125 xl:w-115 drop-shadow-2xl transition-transform duration-500 hover:scale-103"
              data-aos="fade-left"
              data-aos-delay="200"
            />
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 px-4 md:px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12 text-center">
          {/* Users */}
          <div className="flex flex-col items-center gap-3" data-aos="fade-up">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Users className="w-8 h-8 text-primary" />
            </div>

            <span className="text-4xl md:text-5xl font-bold text-slate-900">
              30
            </span>
            <span className="text-base text-slate-600 tracking-wide">
              Total Users
            </span>
          </div>

          {/* Vendors */}
          <div
            className="flex flex-col items-center gap-3"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Store className="w-8 h-8 text-primary" />
            </div>

            <span className="text-4xl md:text-5xl font-bold text-slate-900">
              15
            </span>
            <span className="text-base text-slate-600 tracking-wide">
              Registered Vendors
            </span>
          </div>

          {/* Orders */}
          <div
            className="flex flex-col items-center gap-3"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <ShoppingBag className="w-8 h-8 text-primary" />
            </div>

            <span className="text-4xl md:text-5xl font-bold text-slate-900">
              150
            </span>
            <span className="text-base text-slate-600 tracking-wide">
              Orders Completed
            </span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="scroll-mt-20 py-16 md:py-24 px-4 md:px-6 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <div
            className="text-center mb-12 lg:mb-20"
            data-aos="fade-up"
            data-aos-duration="600"
          >
            <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900 mb-4">
              Built for administrators.
            </h2>
            <p className="text-base text-slate-600 font-light">
              Powerful tools to manage vendors, orders, and marketplace
              operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {features.map((feature, index) => (
              <div
                key={index}
                data-aos="fade-up"
                data-aos-delay={index * 100}
                data-aos-duration="600"
              >
                <FeatureCard {...feature} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LGU Access Section */}
      <section
        id="lgu-access"
        className="py-16 md:py-24 px-4 md:px-6 bg-linear-to-b from-white to-slate-50"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div data-aos="fade-right" data-aos-duration="600">
              <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900 mb-6">
                Transparent oversight for LGUs.
              </h2>
              <p className="text-base md:text-lg text-slate-600 leading-relaxed mb-8 max-w-xl">
                Local government units can apply for viewer access to monitor
                trade statistics, pricing trends, and marketplace activity in
                real-time.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">
                      Trade statistics
                    </h4>
                    <p className="text-slate-600 text-sm">
                      Monitor volume, pricing, and market trends across your
                      jurisdiction.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">
                      Price transparency
                    </h4>
                    <p className="text-slate-600 text-sm">
                      Access historical and real-time seafood pricing data.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">
                      Read-only access
                    </h4>
                    <p className="text-slate-600 text-sm">
                      Secure viewer permissions without operational control.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 rounded-full text-base font-medium border-primary hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
              >
                Apply for LGU Access
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>

            <div
              data-aos="fade-left"
              data-aos-duration="600"
              data-aos-delay="200"
            >
              <div className="bg-linear-to-br from-slate-900 to-slate-800 rounded-2xl p-8 shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                    <span className="text-slate-400 text-sm font-medium">
                      Market Overview
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      Live Data
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <div className="text-slate-400 text-xs mb-1">
                        Daily Volume
                      </div>
                      <div className="text-white text-2xl font-semibold">
                        ₱48,500
                      </div>
                      <div className="text-green-400 text-xs mt-1">+12.5%</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <div className="text-slate-400 text-xs mb-1">
                        Active Vendors
                      </div>
                      <div className="text-white text-2xl font-semibold">
                        15
                      </div>
                      <div className="text-blue-400 text-xs mt-1">+8 today</div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <div className="text-slate-400 text-xs mb-3">
                      Top Products Today
                    </div>
                    <div className="space-y-2">
                      {["Bangus", "Tilapia", "Blue Marlin"].map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-slate-300">{item}</span>
                          <span className="text-white font-medium">
                            ₱{180 - i * 20}/kg
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-700 text-center">
                    <span className="text-slate-500 text-xs">
                      Updated 2 minutes ago
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="contact"
        className="bg-slate-900 text-slate-400"
        data-aos="fade-up"
        data-aos-duration="600"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
          {/* Top grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-16">
            {/* Brand intro */}
            <div className="col-span-2 md:col-span-1 space-y-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary ">
                  <Anchor className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">
                  MARINA
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-400 max-w-xs">
                Access live seafood listings directly from local aquatic
                vendors. Fresh, sustainable, and transparent.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="#"
                  aria-label="Facebook"
                  className="icon-btn flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <SocialIcon icon={siFacebook} />
                </a>
                <a
                  href="#"
                  aria-label="X (Twitter)"
                  className="icon-btn flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <SocialIcon icon={siX} />
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="icon-btn flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <SocialIcon icon={siInstagram} />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider">
                Product
              </h4>
              <ul className="space-y-3 text-sm">
                {["Features", "Security", "Integrations", "Pricing"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href={`#${item.toLowerCase()}`}
                        className="inline-block cursor-pointer transition-all duration-200 hover:text-cyan-400 hover:translate-x-1"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider">
                Resources
              </h4>
              <ul className="space-y-3 text-sm">
                {["Help Center", "User Guide", "System Status", "API Docs"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                        className="inline-block cursor-pointer transition-all duration-200 hover:text-cyan-400 hover:translate-x-1"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider">
                Legal
              </h4>
              <ul className="space-y-3 text-sm">
                {["Privacy Policy", "Terms of Service", "Compliance"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                        className="inline-block cursor-pointer transition-all duration-200 hover:text-cyan-400 hover:translate-x-1"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 md:pt-10 border-t border-slate-600 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Copyright */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">
                © {new Date().getFullYear()}{" "}
                <span className="text-white font-semibold">MARINA</span>. All
                rights reserved.
              </span>
            </div>

            {/* App Downloads */}
            <div className="flex items-center gap-4">
              <a
                href="#"
                aria-label="Download on the App Store"
                className="transition-all duration-300 hover:scale-105 hover:opacity-80"
              >
                <img
                  src="/app-store-icon.svg"
                  alt="Download on the App Store"
                  className="h-10 w-auto"
                />
              </a>
              <a
                href="#"
                aria-label="Get it on Google Play"
                className="transition-all duration-300 hover:scale-105 hover:opacity-80"
              >
                <img
                  src="/google-play.svg"
                  alt="Get it on Google Play"
                  className="h-10 w-auto"
                />
              </a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards; /* Add 'forwards' to keep final state */
        }
      `}</style>
    </div>
  );
};
export default LandingPage;
