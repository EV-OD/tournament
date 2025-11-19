"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  getVenueSlots,
  initializeVenueSlots,
  updateSlotConfig,
  type SlotConfig,
} from "@/lib/slotService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

type SlotEditorProps = {
  venueId: string;
};

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function SlotEditor({ venueId }: SlotEditorProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);
  
  const [config, setConfig] = useState<SlotConfig>({
    startTime: "06:00",
    endTime: "22:00",
    slotDuration: 60,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    timezone: "Asia/Kathmandu",
  });

  useEffect(() => {
    async function loadConfig() {
      setLoading(true);
      try {
        const venueSlots = await getVenueSlots(venueId);
        
        if (venueSlots) {
          setConfig(venueSlots.config);
          setInitialized(true);
        } else {
          setInitialized(false);
        }
      } catch (error) {
        console.error("Error loading slot config:", error);
        toast.error("Failed to load slot configuration");
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, [venueId]);

  const handleSaveConfig = async () => {
    // Validation
    if (!config.startTime || !config.endTime) {
      toast.error("Start time and end time are required");
      return;
    }

    if (config.slotDuration < 15 || config.slotDuration > 240) {
      toast.error("Slot duration must be between 15 and 240 minutes");
      return;
    }

    if (config.daysOfWeek.length === 0) {
      toast.error("At least one day must be selected");
      return;
    }

    const [startHour, startMin] = config.startTime.split(":").map(Number);
    const [endHour, endMin] = config.endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      toast.error("End time must be after start time");
      return;
    }

    const totalMinutes = endMinutes - startMinutes;
    if (totalMinutes < config.slotDuration) {
      toast.error("Time range is too short for the slot duration");
      return;
    }

    setSaving(true);

    try {
      if (initialized) {
        // Update existing config
        await updateSlotConfig(venueId, config);
        toast.success("Slot configuration updated successfully");
      } else {
        // Initialize new config
        await initializeVenueSlots(venueId, config);
        setInitialized(true);
        toast.success("Slot configuration initialized successfully");
      }
    } catch (error) {
      console.error("Error saving slot config:", error);
      toast.error("Failed to save slot configuration");
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: number) => {
    if (config.daysOfWeek.includes(day)) {
      setConfig({
        ...config,
        daysOfWeek: config.daysOfWeek.filter((d) => d !== day),
      });
    } else {
      setConfig({
        ...config,
        daysOfWeek: [...config.daysOfWeek, day].sort(),
      });
    }
  };

  const calculateSlotCount = (): number => {
    const [startHour, startMin] = config.startTime.split(":").map(Number);
    const [endHour, endMin] = config.endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const totalMinutes = endMinutes - startMinutes;
    return Math.floor(totalMinutes / config.slotDuration);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const slotsPerDay = calculateSlotCount();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Slot Configuration</CardTitle>
          <CardDescription>
            {initialized
              ? "Update your venue's slot settings. Changes will apply to future slots."
              : "Initialize slot settings for your venue. This is required before accepting bookings."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={config.startTime}
                onChange={(e) =>
                  setConfig({ ...config, startTime: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={config.endTime}
                onChange={(e) =>
                  setConfig({ ...config, endTime: e.target.value })
                }
              />
            </div>
          </div>

          {/* Slot Duration */}
          <div>
            <Label htmlFor="slotDuration">Slot Duration (minutes)</Label>
            <Input
              id="slotDuration"
              type="number"
              min="15"
              max="240"
              step="15"
              value={config.slotDuration}
              onChange={(e) =>
                setConfig({
                  ...config,
                  slotDuration: parseInt(e.target.value) || 60,
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              {slotsPerDay} slots per day ({config.startTime} - {config.endTime})
            </p>
          </div>

          {/* Days of Week */}
          <div>
            <Label>Operating Days</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={config.daysOfWeek.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                  />
                  <Label
                    htmlFor={`day-${day.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Timezone */}
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={config.timezone}
              onChange={(e) =>
                setConfig({ ...config, timezone: e.target.value })
              }
              placeholder="Asia/Kathmandu"
            />
          </div>

          {/* Save Button */}
          <div className="flex gap-2">
            <Button onClick={handleSaveConfig} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {initialized ? "Update Configuration" : "Initialize Slots"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • <strong>Start/End Time:</strong> Define your venue's operating hours
          </p>
          <p>
            • <strong>Slot Duration:</strong> How long each booking slot lasts (15-240 minutes)
          </p>
          <p>
            • <strong>Operating Days:</strong> Select which days your venue is open
          </p>
          <p>
            • <strong>Efficiency:</strong> Slots are generated on-demand, not stored individually
          </p>
          <p>
            • <strong>Bookings:</strong> Only exceptions (blocked, booked, held) are stored
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
