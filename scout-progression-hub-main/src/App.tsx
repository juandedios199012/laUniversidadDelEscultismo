import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ScoutsPage from "./pages/ScoutsPage";
import ProgressionPage from "./pages/ProgressionPage";
import BitacoraPage from "./pages/BitacoraPage";
import ScoutDetailPage from "./pages/ScoutDetailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/scouts" element={<ScoutsPage />} />
          <Route path="/scout/:id" element={<ScoutDetailPage />} />
          <Route path="/progresion" element={<ProgressionPage />} />
          <Route path="/bitacora" element={<BitacoraPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
