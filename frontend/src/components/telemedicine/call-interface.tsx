"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { useCompleteAppointment } from "@/hooks/use-appointments";
import { Button } from "@/components/ui/button";
import { PhoneOff, User, Monitor, MessageSquare, MoreHorizontal, ChevronLeft } from "lucide-react";
import { useCallback, useState } from "react";

interface CallInterfaceProps {
	teleconsultationId: string;
	appointmentId?: string;
	onEnd?: () => void;
}

function VideoCallInner({ onEndCall, onRemoteJoined }: { onEndCall: () => void; onRemoteJoined?: () => void }) {
	const participants = useParticipants();
	const cameraTracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
	const remoteTracks = cameraTracks.filter((ref) => ref.participant.isLocal === false);
	const localTrack = cameraTracks.find(
		(ref) => ref.participant.isLocal === true && ref.source === Track.Source.Camera,
	);
	const primaryRemote = remoteTracks[0];
	const remoteParticipant = participants.find((p) => !p.isLocal);
	const [showChat, setShowChat] = useState(false);

	if (remoteParticipant && onRemoteJoined) {
		onRemoteJoined();
	}

	return (
		<div className='relative flex h-full w-full min-h-0 flex-col bg-slate-900'>
			{/* Top bar with back button */}
			<div className='absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-4 py-3'>
				<div className='flex items-center gap-3'>
					<Link
						href='/telemedicine'
						className='flex items-center gap-1.5 rounded-lg bg-black/50 px-3 py-2 text-sm font-medium text-white hover:bg-black/70 transition-colors'
					>
						<ChevronLeft className='h-4 w-4' />
						Leave
					</Link>
					<div className='rounded-lg bg-black/50 px-3 py-1.5 text-sm font-medium text-white'>
						{participants.length} in call
					</div>
				</div>
			</div>

			{/* Main area: remote video (or placeholder) */}
			<div className='relative min-h-0 flex-1 flex items-center justify-center bg-slate-800 overflow-hidden'>
				{primaryRemote ? (
					<VideoTrack
						trackRef={primaryRemote}
						className='h-full w-full object-contain'
						style={{ maxHeight: "100%", maxWidth: "100%" }}
					/>
				) : (
					<div className='flex flex-col items-center justify-center gap-4 text-slate-400'>
						<div className='rounded-full bg-slate-700 p-8'>
							<User className='h-20 w-20' />
						</div>
						<p className='text-lg font-medium text-slate-300'>
							Waiting for {remoteParticipant?.name ?? "other participant"} to join…
						</p>
						<p className='text-sm'>Video will appear here</p>
					</div>
				)}
			</div>

			{/* Floating local video */}
			{localTrack && (
				<div className='absolute bottom-28 right-4 z-10 w-40 overflow-hidden rounded-xl border-2 border-white/30 bg-slate-800 shadow-xl md:w-52'>
					<div className='absolute left-0 top-0 z-10 px-2 py-1 text-xs font-medium text-white/90 truncate max-w-full bg-black/40 rounded-tr'>
						You
					</div>
					<VideoTrack
						trackRef={localTrack}
						className='h-full w-full object-cover aspect-video'
						style={{ aspectRatio: "16/10" }}
					/>
				</div>
			)}

			{/* Control bar: centered controls */}
			<div className='absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center py-6'>
				<div className='flex items-center gap-3 rounded-2xl bg-slate-900/90 backdrop-blur-sm px-6 py-3 shadow-2xl'>
					{/* Mic toggle */}
					<TrackToggle
						source={Track.Source.Microphone}
						className='flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-600 bg-slate-800 text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-colors [&_svg]:h-5 [&_svg]:w-5'
					/>
					{/* Camera toggle */}
					<TrackToggle
						source={Track.Source.Camera}
						className='flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-600 bg-slate-800 text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-colors [&_svg]:h-5 [&_svg]:w-5'
					/>
					{/* Screen share toggle */}
					<TrackToggle
						source={Track.Source.ScreenShare}
						className='flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-600 bg-slate-800 text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-colors data-[lk-enabled=true]:bg-primary-700 data-[lk-enabled=true]:border-primary-500 [&_svg]:h-5 [&_svg]:w-5'
					></TrackToggle>
					{/* More options */}
					<button
						className='flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-600 bg-slate-800 text-white hover:bg-slate-700 transition-colors'
						title='More options'
					>
						<MoreHorizontal className='h-5 w-5' />
					</button>
					{/* Divider */}
					<div className='mx-2 h-8 w-px bg-slate-600' />
					{/* End call */}
					<Button
						size='lg'
						variant='destructive'
						className='flex h-12 w-12 items-center justify-center rounded-full p-0'
						onClick={onEndCall}
						title='End call'
					>
						<PhoneOff
							className='h-5 w-5'
							aria-hidden
						/>
					</Button>
				</div>
			</div>
		</div>
	);
}

export function CallInterface({ teleconsultationId, appointmentId, onEnd }: CallInterfaceProps) {
	const router = useRouter();
	const { data: tokenData, isLoading } = useLiveKitToken(teleconsultationId);
	const endMutation = useEndTeleconsultation();
	const completeAppointment = useCompleteAppointment();
	const [bothJoined, setBothJoined] = useState(false);

	const maybeCompleteAppointment = useCallback(() => {
		if (!appointmentId || !bothJoined) return;
		// Fire-and-forget; errors are non-blocking for ending the call.
		completeAppointment.mutate(appointmentId);
	}, [appointmentId, bothJoined, completeAppointment]);

	const handleDisconnected = useCallback(async () => {
		try {
			await endMutation.mutateAsync(teleconsultationId);
			maybeCompleteAppointment();
			onEnd?.();
		} catch {
			// ignore
		}
		router.push("/consultations");
	}, [teleconsultationId, endMutation, onEnd, router]);

	const handleEndCall = async () => {
		try {
			await endMutation.mutateAsync(teleconsultationId);
			maybeCompleteAppointment();
			onEnd?.();
		} catch {
			// ignore
		}
		router.push("/consultations");
	};

	if (isLoading || !tokenData) {
		return (
			<div className='flex h-full items-center justify-center bg-slate-900'>
				<div className='text-center'>
					<div className='mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent' />
					<p className='text-slate-300'>Connecting to video call…</p>
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
			className='h-full w-full'
		>
			<RoomAudioRenderer />
			<VideoCallInner
				onEndCall={handleEndCall}
				onRemoteJoined={() => setBothJoined(true)}
			/>
		</LiveKitRoom>
	);
}
