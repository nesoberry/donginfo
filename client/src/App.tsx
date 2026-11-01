import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import EventsPage from "./pages/EventsPage";
import EventDetail from "./pages/EventDetail";
import AdminPanel from "./pages/AdminPanel";
import NotificationsPage from "./pages/NotificationsPage";
import CalendarPage from "./pages/CalendarPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CopyrightPage from "./pages/CopyrightPage";
import PackagePage from "./pages/PackagePage";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={PackagePage} />
      <Route path={"/events"} component={EventsPage} />
      <Route path={"/calendar"} component={CalendarPage} />
      <Route path={"/event/:id"} component={EventDetail} />
      <Route path={"/admin"} component={AdminPanel} />
      <Route path={"/notifications"} component={NotificationsPage} />
      <Route path={"/privacy"} component={PrivacyPolicy} />
      <Route path={"/copyright"} component={CopyrightPage} />
      <Route path={"/package"} component={PackagePage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
