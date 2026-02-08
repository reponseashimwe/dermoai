"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAvailablePractitioners } from "@/hooks/use-practitioners";
import { AlertTriangle, Video } from "lucide-react";

interface UrgentConsultationBannerProps {
  consultationId: string;
}

export function UrgentConsultationBanner({
  consultationId,
}: UrgentConsultationBannerProps) {
  const { data: practitioners } = useAvailablePractitioners({
    online_only: true,
  });
  const onlineCount = practitioners?.length ?? 0;

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold text-red-800">
              Urgent: Immediate attention recommended
            </p>
            <p className="text-sm text-red-700">
              Connect with a specialist for timely assessment.{" "}
              {onlineCount > 0
                ? `${onlineCount} practitioner${onlineCount === 1 ? "" : "s"} available now.`
                : "Check back for available practitioners."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/telemedicine">
            <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              <Video className="mr-1 h-4 w-4" />
              View available practitioners
            </Button>
          </Link>
          <Link href="/telemedicine">
            <Button size="sm" className="bg-red-600 hover:bg-red-700">
              Start telemedicine consultation
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
