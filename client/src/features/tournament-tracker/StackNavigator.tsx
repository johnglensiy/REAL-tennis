import { useAppSelector } from "../../hooks";
import { selectCurrentScreen } from "./navigationSlice";
import TournamentTracker from "./components/TournamentTracker";
import DummyScreen from "./components/DummyScreen";

const SCREENS = { Home: TournamentTracker, Dummy: DummyScreen };

export function StackNavigator() {
  const currentScreen = useAppSelector(selectCurrentScreen);
  const ScreenComponent = SCREENS[currentScreen.name as keyof typeof SCREENS];
  return <ScreenComponent {...currentScreen.params} />;
}
