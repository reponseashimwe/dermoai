"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const RWANDA_DISTRICTS = [
  "Bugesera",
  "Gatsibo",
  "Kayonza",
  "Kirehe",
  "Ngoma",
  "Nyagatare",
  "Rwamagana",
  "Burera",
  "Gakenke",
  "Gicumbi",
  "Musanze",
  "Rulindo",
  "Gasabo",
  "Kicukiro",
  "Nyarugenge",
  "Gisagara",
  "Huye",
  "Kamonyi",
  "Muhanga",
  "Nyamagabe",
  "Nyanza",
  "Nyaruguru",
  "Ruhango",
  "Karongi",
  "Ngororero",
  "Nyabihu",
  "Nyamasheke",
  "Rubavu",
  "Rusizi",
  "Rutsiro",
];

const RWANDA_PROVINCES = ["Kigali", "Eastern", "Northern", "Southern", "Western"];

const patientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone_number: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  defaultValues?: Partial<PatientFormData>;
  onSubmit: (data: PatientFormData) => Promise<void>;
  submitLabel?: string;
}

export function PatientForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save Patient",
}: PatientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Patient Name"
        placeholder="Full name"
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        label="Phone Number"
        type="tel"
        placeholder="+250 XXX XXX XXX"
        error={errors.phone_number?.message}
        {...register("phone_number")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Province"
          placeholder="Select province"
          options={RWANDA_PROVINCES.map((p) => ({ value: p, label: p }))}
          error={errors.province?.message}
          {...register("province")}
        />
        <Select
          label="District"
          placeholder="Select district"
          options={RWANDA_DISTRICTS.map((d) => ({ value: d, label: d }))}
          error={errors.district?.message}
          {...register("district")}
        />
      </div>
      <Button type="submit" loading={isSubmitting} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
