import { createBrowserRouter } from "react-router";
import { OnboardingAccount } from "./pages/onboarding/OnboardingAccount";
import { OnboardingProfile } from "./pages/onboarding/OnboardingProfile";
import { OnboardingRules } from "./pages/onboarding/OnboardingRules";
import { Login } from "./pages/onboarding/Login";
import { MainLayout } from "./pages/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { DailyCheck } from "./pages/DailyCheck";
import { RevengeX } from "./pages/RevengeX";
import { Journal } from "./pages/Journal";
import { TradeReplay } from "./pages/TradeReplay";
import { Social } from "./pages/Social";
import { UserProfile } from "./pages/UserProfile";
import { Groups } from "./pages/Groups";
import { GroupDetail } from "./pages/GroupDetail";
import { Credits } from "./pages/Credits";
import { DirectMessages } from "./pages/DirectMessages";
import { Notifications } from "./pages/Notifications";
import { Settings } from "./pages/Settings";
import { EditRules } from "./pages/EditRules";
import { Upgrade } from "./pages/Upgrade";
import { AIAnalytics } from "./pages/AIAnalytics";
import { Achievements } from "./pages/Achievements";
import { PropFirmSuccess } from "./pages/PropFirmSuccess";
import { MentalPreparation } from "./pages/MentalPreparation";
import { DebugStorage } from "./pages/DebugStorage";
import { TermsAndPrivacy } from "./pages/TermsAndPrivacy";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <OnboardingAccount />,
  },
  {
    path: "/onboarding/profile",
    element: <OnboardingProfile />,
  },
  {
    path: "/onboarding/rules",
    element: <OnboardingRules />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/app",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "daily-check",
        element: <DailyCheck />,
      },
      {
        path: "revengex",
        element: <RevengeX />,
      },
      {
        path: "journal",
        element: <Journal />,
      },
      {
        path: "trade-replay/:entryId",
        element: <TradeReplay />,
      },
      {
        path: "social",
        element: <Social />,
      },
      {
        path: "profile/:userId",
        element: <UserProfile />,
      },
      {
        path: "groups",
        element: <Groups />,
      },
      {
        path: "groups/:groupId",
        element: <GroupDetail />,
      },
      {
        path: "credits",
        element: <Credits />,
      },
      {
        path: "messages",
        element: <DirectMessages />,
      },
      {
        path: "messages/:userId",
        element: <DirectMessages />,
      },
      {
        path: "notifications",
        element: <Notifications />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "edit-rules",
        element: <EditRules />,
      },
      {
        path: "upgrade",
        element: <Upgrade />,
      },
      {
        path: "ai-analytics",
        element: <AIAnalytics />,
      },
      {
        path: "achievements",
        element: <Achievements />,
      },
      {
        path: "prop-firm-success",
        element: <PropFirmSuccess />,
      },
      {
        path: "mental-prep",
        element: <MentalPreparation />,
      },
      {
        path: "debug-storage",
        element: <DebugStorage />,
      },
      {
        path: "legal",
        element: <TermsAndPrivacy />,
      },
    ],
  },
]);
