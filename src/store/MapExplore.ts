import { MapControlMode } from "../type";
import { filterControlMode } from "./MapControl";

export const filterIsExploreMode = () => filterControlMode(MapControlMode.Explore)
