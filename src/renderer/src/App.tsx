import { ThemeProvider } from '@/components/ThemeProvider';
import { Navbar } from '@/components/Navbar';
import { ExampleComponent } from '@/components/ExampleComponent';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto py-6">
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-foreground">
                Welcome to Bolt Launch Pad
              </h1>
              <p className="text-xl text-muted-foreground">
                A modern desktop application built with Electron, Vite, and React
              </p>
            </div>
            <ExampleComponent />
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;

