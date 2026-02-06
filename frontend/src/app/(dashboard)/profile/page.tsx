"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { fetchClient } from "@/lib/api/client";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { isApiError } from "@/lib/api/errors";
import type { User } from "@/types/api";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  phone_number: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: user
      ? {
          name: user.name,
          email: user.email,
          phone_number: user.phone_number || "",
        }
      : undefined,
  });

  async function onSubmit(data: ProfileForm) {
    setError(null);
    try {
      await fetchClient<User>("/api/users/me", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      await refreshUser();
      toast("Profile updated successfully", "success");
    } catch (err) {
      if (isApiError(err)) {
        setError(err.detail);
      } else {
        setError("Failed to update profile");
      }
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Manage your account settings" />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="flex flex-col items-center pt-6">
            <Avatar name={user.name} size="lg" />
            <h2 className="mt-3 text-lg font-semibold text-slate-900">
              {user.name}
            </h2>
            <p className="text-sm text-slate-500">{user.email}</p>
            <Badge
              variant={user.role === "ADMIN" ? "info" : "default"}
              className="mt-2"
            >
              {user.role}
            </Badge>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">
              Edit Profile
            </h2>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full Name"
                error={errors.name?.message}
                {...register("name")}
              />
              <Input
                label="Email"
                type="email"
                error={errors.email?.message}
                {...register("email")}
              />
              <Input
                label="Phone Number"
                type="tel"
                error={errors.phone_number?.message}
                {...register("phone_number")}
              />
              <div className="flex gap-3">
                <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
                  Save Changes
                </Button>
                <Button type="button" variant="destructive" onClick={logout}>
                  Sign Out
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
