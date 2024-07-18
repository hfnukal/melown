"ise client";
import { AppProvider } from "@/components/AppContext";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <main>
      <AppProvider>
        <Dashboard />
      </AppProvider>
    </main>
  );
}

