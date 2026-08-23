"use client";

import { Dialog, DialogPanel, DialogBackdrop, CloseButton } from "@headlessui/react";
import type * as React from "react";

import Icon from "./icon";

type ModalProps = {
	classWrapper?: string;
	open: boolean;
	onClose: () => void;
	children: React.ReactNode;
};

const Modal = ({ classWrapper, open, onClose, children }: ModalProps) => {
	return (
		<Dialog className="relative z-50" open={open} onClose={onClose}>
			<DialogBackdrop
				className="inset-0 ease-out max-md:bg-b-surface1 fixed bg-[#282828]/90 duration-300 data-closed:opacity-0"
				transition
			/>
			<div className="inset-0 p-4 max-md:p-0 fixed flex overflow-y-auto">
				<DialogPanel
					className={`max-w-120 p-16 bg-b-surface1 ease-out max-md:px-6 max-md:pb-12 m-auto w-full rounded-4xl duration-300 data-closed:opacity-0 ${
						classWrapper || ""
					}`}
					transition
				>
					{children}
					<CloseButton className="group top-5 right-5 size-12 bg-b-surface2 text-0 fill-t-secondary hover:shadow-hover hover:fill-t-primary dark:bg-b-surface3 max-md:top-2 max-md:right-2 absolute z-15 rounded-full transition-all">
						<Icon className="fill-inherit" name="close" />
					</CloseButton>
				</DialogPanel>
			</div>
		</Dialog>
	);
};

export default Modal;
