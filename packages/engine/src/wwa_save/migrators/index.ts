import { WWAData } from "../../wwa_data";
import { migrateGameOverPolicy } from "./migrate-gameover-policy"

export const applyAllMigrators = (wwaData: WWAData): WWAData => migrateGameOverPolicy(wwaData);