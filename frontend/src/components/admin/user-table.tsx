"use client";

import { useUsers, useDeactivateUser } from "@/hooks/use-users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import { UserX } from "lucide-react";

export function UserTable() {
  const { data: users, isLoading } = useUsers();
  const deactivate = useDeactivateUser();
  const { toast } = useToast();

  async function handleDeactivate(userId: string) {
    try {
      await deactivate.mutateAsync(userId);
      toast("User deactivated", "success");
    } catch {
      toast("Failed to deactivate user", "error");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-600">
              Name
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">
              Email
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">
              Role
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">
              Status
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">
              Joined
            </th>
            <th className="px-4 py-3 text-right font-medium text-slate-600">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {users?.map((user) => (
            <tr key={user.user_id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">
                {user.name}
              </td>
              <td className="px-4 py-3 text-slate-600">{user.email}</td>
              <td className="px-4 py-3">
                <Badge
                  variant={
                    user.role === "ADMIN"
                      ? "info"
                      : user.role === "PRACTITIONER"
                      ? "warning"
                      : "default"
                  }
                >
                  {user.role}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant={user.is_active ? "safe" : "urgent"}>
                  {user.is_active ? "Active" : "Inactive"}
                </Badge>
              </td>
              <td className="px-4 py-3 text-slate-500">
                {formatDate(user.created_at)}
              </td>
              <td className="px-4 py-3 text-right">
                {user.is_active && user.role !== "ADMIN" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeactivate(user.user_id)}
                    loading={deactivate.isPending}
                  >
                    <UserX className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
