"use client";

import { useState } from "react";
import { usePatients, useCreatePatient } from "@/hooks/use-patients";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Patient } from "@/types/api";
import { PROVINCES, getDistrictsForProvince } from "@/lib/locations";

interface PatientSelectProps {
	onSelect: (patient: Patient) => void;
	selectedId?: string;
	/** When provided, the new-patient form shows a single "Create consultation" button that creates the patient and then runs this (e.g. create consultation and redirect). */
	onCreateAndStartConsultation?: (patient: Patient) => void | Promise<void>;
}

export function PatientSelect({ onSelect, selectedId, onCreateAndStartConsultation }: PatientSelectProps) {
	const { data: patients, isLoading } = usePatients();
	const createPatient = useCreatePatient();
	const [search, setSearch] = useState("");
	const [showCreate, setShowCreate] = useState(false);
	const [newName, setNewName] = useState("");
	const [newPhone, setNewPhone] = useState("");
	const [newDistrict, setNewDistrict] = useState("");
	const [newProvince, setNewProvince] = useState("");
	const [provinceError, setProvinceError] = useState<string | undefined>();
	const [districtError, setDistrictError] = useState<string | undefined>();
	const [mode, setMode] = useState<"create" | "select">("select");

	const filtered = patients?.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

	function validateLocation() {
		let hasError = false;
		if (!newProvince) {
			setProvinceError("Select a province");
			hasError = true;
		} else {
			setProvinceError(undefined);
		}
		if (!newDistrict) {
			setDistrictError("Select a district");
			hasError = true;
		} else {
			setDistrictError(undefined);
		}
		return !hasError;
	}

	async function handleCreate() {
		if (!newName.trim()) return;
		if (!validateLocation()) return;
		const patient = await createPatient.mutateAsync({
			name: newName.trim(),
			phone_number: newPhone.trim() || undefined,
			district: newDistrict.trim() || undefined,
			province: newProvince.trim() || undefined,
		});
		onSelect(patient);
		setShowCreate(false);
		setNewName("");
		setNewPhone("");
	}

	async function handleCreateAndStartConsultation() {
		if (!newName.trim()) return;
		if (!validateLocation()) return;
		const patient = await createPatient.mutateAsync({
			name: newName.trim(),
			phone_number: newPhone.trim() || undefined,
			district: newDistrict.trim() || undefined,
			province: newProvince.trim() || undefined,
		});
		onSelect(patient);
		setShowCreate(false);
		setNewName("");
		setNewPhone("");
		await onCreateAndStartConsultation?.(patient);
	}

	return (
		<div className='space-y-3'>
			{/* Mode tabs */}
			<div className='flex gap-2'>
				<Button
					variant={mode === "select" ? "primary" : "outline"}
					size='sm'
					className='w-full'
					onClick={() => setMode("select")}
				>
					Select
				</Button>
				<Button
					variant={mode === "create" ? "primary" : "outline"}
					size='sm'
					className='w-full'
					onClick={() => setMode("create")}
				>
					Create
				</Button>
			</div>
			{mode === "select" && (
				<>
					<div className='relative'>
						<Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
						<input
							type='text'
							placeholder='Search patients...'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className='h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20'
						/>
					</div>

					{isLoading && (
						<div className='flex justify-center py-4'>
							<Spinner />
						</div>
					)}

					<div className='max-h-72 space-y-1 overflow-auto'>
						{filtered?.map((patient) => (
							<button
								key={patient.patient_id}
								onClick={() => onSelect(patient)}
								className={cn(
									"flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
									selectedId === patient.patient_id
										? "bg-primary-50 text-primary-700"
										: "hover:bg-slate-50",
								)}
							>
								<User className='h-4 w-4 shrink-0 text-slate-400' />
								<div>
									<p className='font-medium'>{patient.name}</p>
									{patient.phone_number && (
										<p className='text-xs text-slate-500'>{patient.phone_number}</p>
									)}
								</div>
							</button>
						))}
					</div>
				</>
			)}

			{mode === "create" && (
				<Card>
					<CardContent className='space-y-3 pt-4'>
						<Input
							label='Patient Name'
							placeholder='Full name'
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
						/>
						<Input
							label='Phone (optional)'
							placeholder='+250 XXX XXX XXX'
							value={newPhone}
							onChange={(e) => setNewPhone(e.target.value)}
						/>
						<div className='grid gap-3 sm:grid-cols-2'>
							<Select
								label='Province'
								placeholder='Select province'
								value={newProvince}
								onChange={(e) => {
									const value = e.target.value;
									setNewProvince(value);
									setProvinceError(undefined);
									// Reset district when province changes
									setNewDistrict("");
									setDistrictError(undefined);
								}}
								options={PROVINCES.map((p) => ({ value: p.value, label: p.label }))}
								error={provinceError}
							/>
							<Select
								label='District'
								placeholder='Select district'
								value={newDistrict}
								onChange={(e) => {
									setNewDistrict(e.target.value);
									setDistrictError(undefined);
								}}
								options={getDistrictsForProvince(newProvince).map((d) => ({
									value: d.value,
									label: d.label,
								}))}
								disabled={!newProvince}
								error={districtError}
							/>
						</div>
						<div className='flex flex-col gap-2'>
							{onCreateAndStartConsultation ? (
								<div className='flex gap-2'>
									<Button
										size='sm'
										loading={createPatient.isPending}
										onClick={handleCreateAndStartConsultation}
										className='flex-1'
									>
										Create consultation
									</Button>
									<Button
										size='sm'
										variant='ghost'
										onClick={() => setShowCreate(false)}
									>
										Cancel
									</Button>
								</div>
							) : (
								<div className='flex gap-2'>
									<Button
										size='sm'
										loading={createPatient.isPending}
										onClick={handleCreate}
									>
										Create
									</Button>
									<Button
										size='sm'
										variant='ghost'
										onClick={() => setShowCreate(false)}
									>
										Cancel
									</Button>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
