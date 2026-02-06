"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCreateRetrainingLog } from "@/hooks/use-retraining-logs";
import { useToast } from "@/components/ui/toast";
import { isApiError } from "@/lib/api/errors";

interface LogFormData {
  dataset_size: number;
  accuracy?: number;
  model_version: string;
}

const logSchema = z.object({
  dataset_size: z.number().min(1, "Dataset size must be at least 1"),
  accuracy: z.number().min(0).max(1).optional(),
  model_version: z.string().min(1, "Model version is required"),
});

export function RetrainingLogForm() {
  const createLog = useCreateRetrainingLog();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LogFormData>({
    resolver: zodResolver(logSchema) as never,
  });

  async function onSubmit(data: LogFormData) {
    try {
      await createLog.mutateAsync({
        dataset_size: data.dataset_size,
        accuracy: data.accuracy,
        model_version: data.model_version,
      });
      toast("Retraining log created", "success");
      reset();
    } catch (err) {
      if (isApiError(err)) {
        toast(err.detail, "error");
      } else {
        toast("Failed to create log", "error");
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-slate-900">
          Log Model Retraining
        </h3>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Model Version"
            placeholder="e.g., v1.2.0"
            error={errors.model_version?.message}
            {...register("model_version")}
          />
          <Input
            label="Dataset Size"
            type="number"
            placeholder="Number of images"
            error={errors.dataset_size?.message}
            {...register("dataset_size", { valueAsNumber: true })}
          />
          <Input
            label="Accuracy (0-1)"
            type="number"
            step="0.001"
            placeholder="e.g., 0.85"
            error={errors.accuracy?.message}
            {...register("accuracy", { valueAsNumber: true })}
          />
          <Button type="submit" loading={isSubmitting}>
            Create Log
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
