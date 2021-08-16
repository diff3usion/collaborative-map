import { MapControlMode } from "../Type";
import { filterControlMode } from "./MapControl";

export const filterIsExploreMode = () => filterControlMode(MapControlMode.Explore)
