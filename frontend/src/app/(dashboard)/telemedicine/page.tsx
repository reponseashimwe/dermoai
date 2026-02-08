"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAvailablePractitioners } from "@/hooks/use-practitioners";
import { Video, Circle, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function TelemedicinePage() {
  const [filter, setFilter] = useState<"all" | "online">("online");
  const { data: practitioners, isLoading } = useAvailablePractitioners({
    online_only: filter === "online",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Telemedicine Consultation"
        description="Connect with available practitioners via video call"
      />

      <div className="flex gap-2">
        <Button
          variant={filter === "online" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("online")}
        >
          Online now
        </Button>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All practitioners
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">
            Available Practitioners
          </h2>
          <p className="text-sm text-slate-500">
            Video call integration will be available here. Select a practitioner
            to start.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !practitioners?.length ? (
            <div className="py-8 text-center text-slate-500">
              <Video className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-2 font-medium">No practitioners available</p>
              <p className="text-sm">
                {filter === "online"
                  ? "No one is online right now. Try viewing all practitioners."
                  : "No practitioners are registered yet."}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {practitioners.map((p) => (
                <li key={p.practitioner_id}>
                  <Card>
                    <CardContent className="flex flex-row items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            p.is_online ? "bg-green-100" : "bg-slate-100"
                          }`}
                        >
                          {p.is_online ? (
                            <Circle className="h-3 w-3 fill-green-600 text-green-600" />
                          ) : (
                            <Circle className="h-3 w-3 fill-slate-400 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{p.name}</p>
                          <p className="text-sm text-slate-500">
                            {p.practitioner_type === "SPECIALIST"
                              ? "Specialist"
                              : "General"}{" "}
                            {p.expertise ? `· ${p.expertise}` : ""}
                          </p>
                          {!p.is_online && p.last_active && (
                            <p className="text-xs text-slate-400">
                              Last active: {formatDate(p.last_active)}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        disabled={!p.is_online}
                        title={
                          p.is_online
                            ? "Start video call (coming soon)"
                            : "Practitioner is offline"
                        }
                      >
                        <Video className="mr-1 h-4 w-4" />
                        {p.is_online ? "Start Video Call" : "Offline"}
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">
            Scheduled Appointments
          </h2>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-slate-500">
            <Clock className="h-5 w-5" />
            <p className="text-sm">
              Scheduling will be available when video call is integrated.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
