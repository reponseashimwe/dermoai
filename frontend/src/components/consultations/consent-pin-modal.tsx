"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Loader2, CheckCircle2, Phone } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";

interface ConsentPinModalProps {
  open: boolean;
  onClose: () => void;
  consultationId: string;
  onSuccess: () => void;
}

type ConsentStep = "initial" | "pin_sent" | "verifying" | "verified";

export function ConsentPinModal({
  open,
  onClose,
  consultationId,
  onSuccess,
}: ConsentPinModalProps) {
  const [step, setStep] = useState<ConsentStep>("initial");
  const [pin, setPin] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const { toast } = useToast();

  async function handleRequestPin() {
    setStep("verifying");
    try {
      const response = await apiClient.post(
        `/api/consultations/${consultationId}/request-consent-pin`
      );
      
      setPhoneNumber(response.data.phone_number);
      setExpiresAt(response.data.expires_at);
      setStep("pin_sent");
      
      if (response.data.status === "created") {
        toast(
          "PIN created but SMS service not configured. Check logs for PIN.",
          "warning"
        );
      } else {
        toast(`Consent PIN sent to ${response.data.phone_number}`, "success");
      }
    } catch (error) {
      setStep("initial");
      if (isApiError(error)) {
        toast(error.detail, "error");
      } else {
        toast("Failed to send consent PIN", "error");
      }
    }
  }

  async function handleVerifyPin() {
    if (pin.length !== 6) {
      toast("PIN must be 6 digits", "error");
      return;
    }

    setStep("verifying");
    try {
      const response = await apiClient.post(
        `/api/consultations/${consultationId}/verify-consent-pin`,
        { pin }
      );

      setStep("verified");
      toast(
        `Consent verified! ${response.data.images_updated} images updated.`,
        "success"
      );
      
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (error) {
      setStep("pin_sent");
      if (isApiError(error)) {
        toast(error.detail, "error");
      } else {
        toast("Invalid or expired PIN", "error");
      }
    }
  }

  function handleClose() {
    setStep("initial");
    setPin("");
    setPhoneNumber("");
    setExpiresAt("");
    onClose();
  }

  function formatPhoneNumber(phone: string) {
    if (phone.length > 4) {
      return phone.slice(0, -4).replace(/./g, "X") + phone.slice(-4);
    }
    return phone;
  }

  return (
    <Modal open={open} onClose={handleClose} title="SMS Consent Verification">
      <div className="space-y-4">
        {step === "initial" && (
          <>
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="flex gap-3">
                <Phone className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">
                    SMS Consent Required
                  </p>
                  <p className="text-sm text-blue-700">
                    A 6-digit PIN will be sent to the patient's phone number. The
                    patient (or you on their behalf) must enter this PIN to grant
                    consent for images to be reviewed by specialists.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleClose} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleRequestPin} className="flex-1">
                Send PIN via SMS
              </Button>
            </div>
          </>
        )}

        {step === "pin_sent" && (
          <>
            <div className="space-y-3">
              <div className="rounded-lg bg-green-50 p-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-900">
                      PIN Sent Successfully
                    </p>
                    <p className="text-sm text-green-700">
                      A 6-digit PIN was sent to {formatPhoneNumber(phoneNumber)}.
                      It will expire in 10 minutes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Enter PIN <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setPin(value);
                  }}
                  placeholder="123456"
                  className="text-center text-2xl tracking-widest font-mono"
                  autoFocus
                />
                <p className="text-xs text-slate-500">
                  Ask the patient to provide the PIN they received via SMS
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleClose} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleVerifyPin}
                disabled={pin.length !== 6}
                className="flex-1"
              >
                Verify & Grant Consent
              </Button>
            </div>
          </>
        )}

        {step === "verifying" && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <p className="mt-3 text-sm text-slate-600">Processing...</p>
          </div>
        )}

        {step === "verified" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-900">
              Consent Verified!
            </p>
            <p className="text-sm text-slate-600">
              Images are now available for specialist review
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
