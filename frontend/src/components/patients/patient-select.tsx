"use client";

import { useState } from "react";
import { usePatients, useCreatePatient } from "@/hooks/use-patients";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Plus, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Patient } from "@/types/api";

interface PatientSelectProps {
  onSelect: (patient: Patient) => void;
  selectedId?: string;
}

export function PatientSelect({ onSelect, selectedId }: PatientSelectProps) {
  const { data: patients, isLoading } = usePatients();
  const createPatient = useCreatePatient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const filtered = patients?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate() {
    if (!newName.trim()) return;
    const patient = await createPatient.mutateAsync({
      name: newName.trim(),
      phone_number: newPhone.trim() || undefined,
    });
    onSelect(patient);
    setShowCreate(false);
    setNewName("");
    setNewPhone("");
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search patients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      )}

      <div className="max-h-48 space-y-1 overflow-auto">
        {filtered?.map((patient) => (
          <button
            key={patient.patient_id}
            onClick={() => onSelect(patient)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
              selectedId === patient.patient_id
                ? "bg-primary-50 text-primary-700"
                : "hover:bg-slate-50"
            )}
          >
            <User className="h-4 w-4 shrink-0 text-slate-400" />
            <div>
              <p className="font-medium">{patient.name}</p>
              {patient.phone_number && (
                <p className="text-xs text-slate-500">{patient.phone_number}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {!showCreate ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="h-4 w-4" />
          New Patient
        </Button>
      ) : (
        <Card>
          <CardContent className="space-y-3 pt-4">
            <Input
              label="Patient Name"
              placeholder="Full name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              label="Phone (optional)"
              placeholder="+250 XXX XXX XXX"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                loading={createPatient.isPending}
                onClick={handleCreate}
              >
                Create
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
