"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useConditions, useCreateCondition } from "@/hooks/use-conditions";
import { Plus, ArrowLeft } from "lucide-react";

interface ConditionSelectProps {
	value: string;
	onChange: (value: string) => void;
	allowCustom?: boolean;
}

type FormMode = "select" | "add";

export function ConditionSelect({ value, onChange, allowCustom = true }: ConditionSelectProps) {
	const { data: conditions } = useConditions();
	const createMutation = useCreateCondition();
	const [mode, setMode] = useState<FormMode>("select");
	const [newConditionName, setNewConditionName] = useState("");

	const handleAddNew = async () => {
		if (!newConditionName.trim()) return;
		try {
			const result = await createMutation.mutateAsync({
				condition_name: newConditionName.trim(),
			});
			onChange(result.condition_id);
			setNewConditionName("");
			setMode("select");
		} catch (error) {
			console.error("Failed to create condition:", error);
		}
	};

	const options = (conditions ?? []).map((c) => ({
		value: c.condition_id,
		label: `${c.condition_name}${!c.is_predefined ? " (Custom)" : ""}`,
	}));

	// Either select from list OR add new — not both at once
	if (mode === "add") {
		return (
			<div className="space-y-2">
				<div className="flex gap-2">
					<input
						type="text"
						value={newConditionName}
						onChange={(e) => setNewConditionName(e.target.value)}
						placeholder="New condition name"
						className="flex-1 h-10 rounded-lg border border-slate-300 px-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
					/>
					<Button
						type="button"
						size="sm"
						onClick={handleAddNew}
						disabled={createMutation.isPending || !newConditionName.trim()}
					>
						Add
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => {
							setMode("select");
							setNewConditionName("");
						}}
					>
						<ArrowLeft className="h-4 w-4" />
						Back
					</Button>
				</div>
				{createMutation.isError && (
					<Alert variant="error">Failed to create condition</Alert>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<Select
				value={value}
				onChange={(e) => onChange(e.target.value)}
				options={options}
				placeholder="Select a condition..."
			/>
			{allowCustom && (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => setMode("add")}
					className="w-full text-slate-600"
				>
					<Plus className="h-4 w-4" />
					Add new label
				</Button>
			)}
		</div>
	);
}
