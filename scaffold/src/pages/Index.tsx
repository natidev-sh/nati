// Simple starter page - modify this to build your app

import { MadeWithNati } from "@/components/made-with-nati";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content - centered */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-3xl mx-auto">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 shadow-lg">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-12 h-12"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  className="fill-white dark:fill-gray-900"
                />
                <path
                  d="M2 17L12 22L22 17"
                  className="stroke-white dark:stroke-gray-900"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  className="stroke-white dark:stroke-gray-900"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Welcome to Your App
          </h1>
          
          {/* Description */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Get started by editing this page or ask AI to build features for you.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href="https://natiweb.vercel.app/docs" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl border-2 border-border hover:border-foreground transition-all duration-200 font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Docs
            </a>
            <a 
              href="/chat" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-foreground text-background hover:opacity-90 transition-all duration-200 font-medium shadow-lg"
            >
              Open Chat →
            </a>
          </div>

          {/* Features Grid */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-xl border border-border hover:border-foreground/20 transition-colors">
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="font-semibold mb-2">Fast Setup</h3>
              <p className="text-sm text-muted-foreground">
                Start building immediately with a pre-configured environment
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border hover:border-foreground/20 transition-colors">
              <div className="text-2xl mb-3">🤖</div>
              <h3 className="font-semibold mb-2">AI-Powered</h3>
              <p className="text-sm text-muted-foreground">
                Generate components and features using natural language
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border hover:border-foreground/20 transition-colors">
              <div className="text-2xl mb-3">🎨</div>
              <h3 className="font-semibold mb-2">Beautiful UI</h3>
              <p className="text-sm text-muted-foreground">
                Built with Tailwind CSS and modern design principles
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 border-t border-border">
        <div className="flex justify-center">
          <MadeWithNati />
        </div>
      </footer>
    </div>
  );
};

export default Index;
