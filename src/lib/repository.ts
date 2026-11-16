import { apiRepository } from "./api/festivals";
import { createMockRepository } from "./mock/repository";
export const isMock = process.env.NEXT_PUBLIC_DATA_MODE !== "api";
export const festivalRepository = isMock
  ? createMockRepository(process.env.NEXT_PUBLIC_MOCK_SCENARIO)
  : apiRepository;
