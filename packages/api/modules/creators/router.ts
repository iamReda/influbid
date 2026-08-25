import { estimateMyBidIncrease, mockConfirmBidIncrease } from "./procedures/bid-increase";
import { createPendingCreatorProcedure } from "./procedures/create-pending-creator";
import { estimateCreatorRank, listCategories } from "./procedures/list-categories";
import { listCategoryCardsProcedure, listCreatorLeaderboard } from "./procedures/list-leaderboard";
import { getMyAnalytics, getMyCreator, listMyBids, markAccountClaimed } from "./procedures/me";
import {
	getMockPaymentsStatus,
	mockConfirmInitialPayment,
} from "./procedures/mock-confirm-initial-payment";
import { getMyCreatorForEdit, updateMyCreator } from "./procedures/update-my-creator";

export const creatorsRouter = {
	listCategories,
	estimateRank: estimateCreatorRank,
	listCategoryCards: listCategoryCardsProcedure,
	listLeaderboard: listCreatorLeaderboard,
	createPendingCreator: createPendingCreatorProcedure,
	getMockPaymentsStatus,
	mockConfirmInitialPayment,
	getMyCreator,
	getMyCreatorForEdit,
	updateMyCreator,
	getMyAnalytics,
	listMyBids,
	markAccountClaimed,
	estimateMyBidIncrease,
	mockConfirmBidIncrease,
};
