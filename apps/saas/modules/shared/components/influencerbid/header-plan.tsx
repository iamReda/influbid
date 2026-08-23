import Button from "@repo/ui/components/influencerbid/button";
import Icon from "@repo/ui/components/influencerbid/icon";
import useEventsStore from "@shared/store/use-events-store";

const Plan = ({}) => {
	const isPremiumPlan = useEventsStore((state) => state.isPremiumPlan);

	return (
		<div className="group max-md:hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
			{isPremiumPlan ? (
				<div className="gap-2 text-body-bold flex items-center">
					<Icon className="fill-primary2" name="verification" />
					<div className="">UI8 Studio 2024</div>
				</div>
			) : (
				<>
					<button className="gap-2 h-12 px-3 text-body-bold group-hover:bg-b-surface2 flex items-center rounded-3xl transition-colors">
						<Icon
							className="fill-t-tertiary group-hover:fill-t-primary transition-colors"
							name="lock"
						/>
						<div className="">UI8 Studio 2024</div>
					</button>
					<div className="w-115 pt-4 invisible absolute top-full left-1/2 -translate-x-1/2 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
						<div className="dropdown-arrow-up p-6 bg-b-surface2 shadow-hover relative flex rounded-4xl">
							<div className="pr-6 grow">
								<div className="mb-1 text-body-lg-bold">Go premium!</div>
								<div className="text-heading-thin text-t-secondary">
									Unlock all premium features for just $4.99/month. Enjoy section regeneration, PDF
									export, and email sharing!
								</div>
							</div>
							<Button className="" isSecondary>
								Upgrade
							</Button>
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export default Plan;
