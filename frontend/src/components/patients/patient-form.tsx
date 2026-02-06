"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const patientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone_number: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  defaultValues?: PatientFormData;
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
      <Button type="submit" loading={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
