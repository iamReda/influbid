import {
	createCategory,
	deleteCategory,
	listCategories,
	reorderCategories,
	updateCategory,
} from "./procedures/categories";
import { createAdmin } from "./procedures/create-admin";
import { findOrganization } from "./procedures/find-organization";
import { getDashboard } from "./procedures/get-dashboard";
import { getInfluencer } from "./procedures/get-influencer";
import { listOrganizations } from "./procedures/list-organizations";
import { listPaymentHistory } from "./procedures/list-payment-history";
import { listUsers } from "./procedures/list-users";

export const adminRouter = {
	dashboard: {
		get: getDashboard,
	},
	users: {
		list: listUsers,
		getInfluencer,
		createAdmin,
	},
	organizations: {
		list: listOrganizations,
		find: findOrganization,
	},
	categories: {
		list: listCategories,
		create: createCategory,
		update: updateCategory,
		delete: deleteCategory,
		reorder: reorderCategories,
	},
	paymentHistory: {
		list: listPaymentHistory,
	},
};
