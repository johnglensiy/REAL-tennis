import { useAppSelector } from "../../hooks";
import { selectCurrentScreen } from "./navigationSlice";
import TournamentTracker from "./components/TournamentTracker";
import DummyScreen from "./components/DummyScreen";
import MatchScreen from "./components/MatchScreen";

const SCREENS = {
  Home: TournamentTracker,
  Dummy: DummyScreen,
  Match: MatchScreen,
};

export function StackNavigator() {
  const currentScreen = useAppSelector(selectCurrentScreen);
  const ScreenComponent = SCREENS[currentScreen.name as keyof typeof SCREENS];
  return <ScreenComponent {...currentScreen.params} />;
}
