import { create } from "zustand";

type Store = {
	isPremiumPlan: boolean;
};

const useEventsStore = create<Store>()(() => ({
	isPremiumPlan: false,
}));

export default useEventsStore;
