import { createAvatarUploadUrl } from "./procedures/create-avatar-upload-url";
import { getPublicProfile } from "./procedures/get-public-profile";
import { updateProfile } from "./procedures/update-profile";

export const usersRouter = {
	avatarUploadUrl: createAvatarUploadUrl,
	getPublicProfile,
	updateProfile,
};
