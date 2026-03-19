"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchClient } from "@/lib/api/client";
import type { Image, QuickScanResponse } from "@/types/api";

function imageToResult(image: Image): QuickScanResponse {
	const confidence = image.confidence ?? 0;
	const predicted = image.predicted_condition ?? "UNCERTAIN";
	const urgency = image.urgency ?? "REFER";
	return {
		image_id: image.image_id,
		image_url: image.image_url,
		predicted_condition: predicted,
		confidence,
		urgency,
		consent_to_reuse: image.consent_to_reuse,
		all_probabilities: image.all_probabilities ?? undefined,
		model_version: image.model_version ?? undefined,
		triage_stage: image.triage_stage as QuickScanResponse["triage_stage"],
		gradcam_base64: image.gradcam_base64,
		gradcam_metrics: image.gradcam_metrics,
	};
}

export function useResultByImageId(imageId: string | null) {
	return useQuery({
		queryKey: ["result", imageId],
		queryFn: async (): Promise<QuickScanResponse> => {
			if (!imageId) throw new Error("No image ID");
			const image = await fetchClient<Image>(
				`/api/images/${imageId}?include_gradcam=true`
			);
			return imageToResult(image);
		},
		enabled: !!imageId,
	});
}
