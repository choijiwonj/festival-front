import { apiRepository } from "./api/festivals";

// 화면 데이터는 항상 백엔드에서 조회합니다. 로컬 데이터 대체 경로는 없습니다.
export const festivalRepository = apiRepository;
