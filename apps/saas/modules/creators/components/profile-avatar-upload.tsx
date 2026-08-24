"use client";

import { getAvatarSrc, getInitials } from "@creators/lib/profile";
import Icon from "@repo/ui/components/influencerbid/icon";
import Image from "@repo/ui/components/influencerbid/image";
import { CropImageDialog } from "@settings/components/CropImageDialog";
import { useMemo, useState, type HTMLAttributes } from "react";
import { useDropzone } from "react-dropzone";

type ProfileAvatarUploadProps = {
	name: string;
	image: string | null;
	previewUrl?: string | null;
	saving?: boolean;
	onCropped: (blob: Blob) => void;
};

export function ProfileAvatarUpload({
	name,
	image,
	previewUrl,
	saving = false,
	onCropped,
}: ProfileAvatarUploadProps) {
	const [cropDialogOpen, setCropDialogOpen] = useState(false);
	const [selectedImage, setSelectedImage] = useState<File | null>(null);

	const avatarSrc = useMemo(() => previewUrl ?? getAvatarSrc(image), [image, previewUrl]);

	const { getRootProps, getInputProps } = useDropzone({
		onDrop: (acceptedFiles) => {
			const file = acceptedFiles[0];
			if (!file) {
				return;
			}

			setSelectedImage(file);
			setCropDialogOpen(true);
		},
		accept: {
			"image/png": [".png"],
			"image/jpeg": [".jpg", ".jpeg"],
		},
		multiple: false,
		disabled: saving,
	});

	const onCrop = (croppedImageData: Blob | null) => {
		if (!croppedImageData) {
			return;
		}

		onCropped(croppedImageData);
	};

	return (
		<>
			<div className="shrink-0">
				<div
					className="influencer-avatar group size-28 bg-b-surface1 after:inset-0 max-md:size-24 relative overflow-hidden after:absolute after:z-1 after:bg-[#141414]/30 after:opacity-0 after:transition-opacity hover:after:opacity-100"
					{...(getRootProps() as HTMLAttributes<HTMLDivElement>)}
				>
					<input {...getInputProps()} />
					{avatarSrc ? (
						avatarSrc.startsWith("blob:") ? (
							// oxlint-disable-next-line nextjs/no-img-element -- local crop preview uses a blob URL
							<img
								className="size-full object-cover opacity-100"
								src={avatarSrc}
								width={112}
								height={112}
								alt={`${name} profile photo`}
							/>
						) : (
							<Image
								className="size-full object-cover opacity-100"
								src={avatarSrc}
								width={112}
								height={112}
								alt={`${name} profile photo`}
							/>
						)
					) : (
						<div className="text-h4 text-t-secondary flex size-full items-center justify-center">
							{getInitials(name)}
						</div>
					)}
					{!saving && (
						<Icon
							className="absolute top-1/2 left-1/2 z-2 -translate-x-1/2 -translate-y-1/2 fill-[#FDFDFD] opacity-0 transition-opacity group-hover:opacity-100"
							name="camera-stroke"
						/>
					)}
				</div>
				<p className="mt-2 max-w-28 leading-tight text-t-tertiary max-md:max-w-24 text-center text-[0.625rem]">
					Click to upload image
				</p>
			</div>

			<CropImageDialog
				image={selectedImage}
				open={cropDialogOpen}
				onOpenChange={setCropDialogOpen}
				onCrop={onCrop}
			/>
		</>
	);
}
