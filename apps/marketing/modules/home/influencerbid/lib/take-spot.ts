export const TAKE_SPOT_EVENT = "influbid:take-spot";

export type TakeSpotDetail = {
	dollars: number;
};

export const requestTakeSpot = (dollars: number) => {
	window.dispatchEvent(new CustomEvent<TakeSpotDetail>(TAKE_SPOT_EVENT, { detail: { dollars } }));
};
