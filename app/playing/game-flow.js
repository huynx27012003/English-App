import { childVocabAPI } from "@/service/childVocabAPI";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const GAME_FLOW_KEY = "currentGameFlow";
export const GAME_INDEX_KEY = "currentGameIndex";


export const BASE_GAME_FLOW = [
  "game-fill",
  "game-where",
  "game-choose",
  "game-pick",
  // "game-draw",
  // "game-speak",
];

const FLOW_GAME_COUNT = 3;


export const initGameFlow = async () => {
  const shuffledPool = [...BASE_GAME_FLOW].sort(() => Math.random() - 0.5);
  const flow = shuffledPool.slice(0, FLOW_GAME_COUNT);

  await AsyncStorage.multiSet([
    [GAME_FLOW_KEY, JSON.stringify(flow)],
    [GAME_INDEX_KEY, "0"],
  ]);

  return flow;
};

export const getGameFlowState = async () => {
  const [[, flowRaw], [, indexRaw]] = await AsyncStorage.multiGet([
    GAME_FLOW_KEY,
    GAME_INDEX_KEY,
  ]);

  let flow;
  try {
    flow = flowRaw ? JSON.parse(flowRaw) : null;
  } catch {
    flow = null;
  }

  if (!Array.isArray(flow) || flow.length === 0) {
    const shuffledPool = [...BASE_GAME_FLOW].sort(() => Math.random() - 0.5);
    flow = shuffledPool.slice(0, FLOW_GAME_COUNT);
  }

  let index = parseInt(indexRaw ?? "0", 10);
  if (Number.isNaN(index) || index < 0) index = 0;
  if (index >= flow.length) index = flow.length - 1;

  return { flow, index };
};

export const goToNextGame = async () => {
  const [[, flowRaw], [, indexRaw]] = await AsyncStorage.multiGet([
    GAME_FLOW_KEY,
    GAME_INDEX_KEY,
  ]);

  let flow;
  try {
    flow = flowRaw ? JSON.parse(flowRaw) : null;
  } catch {
    flow = null;
  }

  if (!Array.isArray(flow) || flow.length === 0) {
    const shuffledPool = [...BASE_GAME_FLOW].sort(() => Math.random() - 0.5);
    flow = shuffledPool.slice(0, FLOW_GAME_COUNT);
  }

  let index = parseInt(indexRaw ?? "0", 10);
  if (Number.isNaN(index) || index < 0) index = 0;

  if (index >= flow.length - 1) {
    return { hasNext: false, nextRoute: null };
  }

  const nextIndex = index + 1;
  await AsyncStorage.setItem(GAME_INDEX_KEY, String(nextIndex));

  return { hasNext: true, nextRoute: flow[nextIndex] };
};


export const moveToNextGameOrComplete = async (router) => {
  try {
    const { hasNext, nextRoute } = await goToNextGame();

    if (hasNext && nextRoute) {
      router.replace(`/playing/${nextRoute}`);
      return { finished: false };
    }

    const [childId, vocabId] = await Promise.all([
      AsyncStorage.getItem("childId"),
      AsyncStorage.getItem("levelId"),
    ]);

    if (childId && vocabId) {
      await childVocabAPI.createChildVocab(childId, vocabId);
      await childVocabAPI.addCandy(childId, 10);
    } else {
      console.log(
        "Missing childId or levelId when creating child vocab",
        childId,
        vocabId
      );
    }
  } catch (err) {
    console.log("Error in moveToNextGameOrComplete:", err);
  }

  setTimeout(() => {
    router.replace("/card/CompleteCard");
  }, 500);
  
  return { finished: true };
};
