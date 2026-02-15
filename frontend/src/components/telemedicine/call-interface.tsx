"use client";

import { useRouter } from "next/navigation";
import {
	LiveKitRoom,
	RoomAudioRenderer,
	useParticipants,
	useTracks,
	VideoTrack,
	TrackToggle,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { useEndTeleconsultation, useLiveKitToken } from "@/hooks/use-teleconsultations";
import { Button } from "@/components/ui/button";
import { PhoneOff, User } from "lucide-react";
import { useCallback } from "react";

interface CallInterfaceProps {
	teleconsultationId: string;
	onEnd?: () => void;
}

function VideoCallInner({ onEndCall }: { onEndCall: () => void }) {
	const participants = useParticipants();
	const cameraTracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
	const remoteTracks = cameraTracks.filter((ref) => ref.participant.isLocal === false);
	const localTrack = cameraTracks.find((ref) => ref.participant.isLocal === true);
	const primaryRemote = remoteTracks[0];
	const remoteParticipant = participants.find((p) => !p.isLocal);

	return (
		<div className="relative flex h-full w-full min-h-0 flex-col bg-slate-900">
			{/* Main area: remote video (or placeholder) — full width/height, no margin */}
			<div className="relative min-h-0 flex-1 flex items-center justify-center bg-slate-800 overflow-hidden">
				{primaryRemote ? (
					<VideoTrack
						trackRef={primaryRemote}
						className="h-full w-full object-contain"
						style={{ maxHeight: "100%", maxWidth: "100%" }}
					/>
				) : (
					<div className="flex flex-col items-center justify-center gap-4 text-slate-400">
						<div className="rounded-full bg-slate-700 p-8">
							<User className="h-20 w-20" />
						</div>
						<p className="text-lg font-medium text-slate-300">
							Waiting for {remoteParticipant?.name ?? "other participant"} to join…
						</p>
						<p className="text-sm">Video will appear here</p>
					</div>
				)}
			</div>

			{/* Floating local video */}
			{localTrack && (
				<div className="absolute bottom-24 right-4 z-10 w-40 overflow-hidden rounded-xl border-2 border-white/30 bg-slate-800 shadow-xl md:w-52">
					<div className="absolute left-0 top-0 z-10 px-2 py-1 text-xs font-medium text-white/90 truncate max-w-full bg-black/40 rounded-tr">
						You
					</div>
					<VideoTrack
						trackRef={localTrack}
						className="h-full w-full object-cover aspect-video"
						style={{ aspectRatio: "16/10" }}
					/>
				</div>
			)}

			{/* Control bar: icons centered inside circular wrappers */}
			<div className="flex shrink-0 items-center justify-center gap-4 border-t border-slate-700/50 bg-slate-900/95 px-4 py-4">
				<TrackToggle
					source={Track.Source.Microphone}
					className="grid h-14 w-14 place-items-center rounded-full border-2 border-slate-600 bg-slate-800 text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 [&_svg]:h-6 [&_svg]:w-6 [&_svg]:shrink-0"
				/>
				<TrackToggle
					source={Track.Source.Camera}
					className="grid h-14 w-14 place-items-center rounded-full border-2 border-slate-600 bg-slate-800 text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 [&_svg]:h-6 [&_svg]:w-6 [&_svg]:shrink-0"
				/>
				<Button
					size="lg"
					variant="destructive"
					className="grid h-14 w-14 min-w-14 place-items-center rounded-full p-0"
					onClick={onEndCall}
				>
					<PhoneOff className="h-6 w-6 shrink-0" aria-hidden />
				</Button>
			</div>

			{/* Participant count */}
			<div className="absolute left-4 top-4 z-10 rounded-lg bg-black/50 px-3 py-1.5 text-sm font-medium text-white">
				{participants.length} in call
			</div>
		</div>
	);
}

export function CallInterface({ teleconsultationId, onEnd }: CallInterfaceProps) {
	const router = useRouter();
	const { data: tokenData, isLoading } = useLiveKitToken(teleconsultationId);
	const endMutation = useEndTeleconsultation();

	const handleDisconnected = useCallback(async () => {
		try {
			await endMutation.mutateAsync(teleconsultationId);
			onEnd?.();
		} catch {
			// ignore
		}
		router.push("/consultations");
	}, [teleconsultationId, endMutation, onEnd, router]);

	const handleEndCall = async () => {
		try {
			await endMutation.mutateAsync(teleconsultationId);
			onEnd?.();
		} catch {
			// ignore
		}
		router.push("/consultations");
	};

	if (isLoading || !tokenData) {
		return (
			<div className="flex h-full items-center justify-center bg-slate-900">
				<div className="text-center">
					<div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
					<p className="text-slate-300">Connecting to video call…</p>
				</div>
			</div>
		);
	}

	return (
		<LiveKitRoom
			token={tokenData.token}
			serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || "ws://localhost:7880"}
			connect={true}
			audio={true}
			video={true}
			onDisconnected={handleDisconnected}
			className="h-full w-full"
		>
			<RoomAudioRenderer />
			<VideoCallInner onEndCall={handleEndCall} />
		</LiveKitRoom>
	);
}
