"use client";

import React, { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { MapPin, Trash2, Edit, RotateCcw } from "lucide-react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { DEFAULT_ADVANCE_PERCENT } from "@/lib/pricing/pricing";

type Venue = {
  id: string;
  name?: string;
  address?: string;
  advancePercentage?: number;
  platformCommission?: number;
  createdAt?: any;
  status?: string;
  imageUrls?: string[];
  location?: any;
};

type ArchivedVenue = Venue & {
  archivedStatus?: "deleted" | "rejected";
  archivalReason?: string;
  archivedBy?: string;
  archivedAt?: any;
};

export default function AdminVenuesPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [archivedVenues, setArchivedVenues] = useState<ArchivedVenue[]>([]);
  const [activeTab, setActiveTab] = useState<string>("active");

  // Create form state
  const [creating, setCreating] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [newAddress, setNewAddress] = useState<string>("");
  const [newAdvancePercent, setNewAdvancePercent] = useState<string>(String(DEFAULT_ADVANCE_PERCENT));
  const [newPlatformCommission, setNewPlatformCommission] = useState<string>("0");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editAddress, setEditAddress] = useState<string>("");
  const [editAdvancePercent, setEditAdvancePercent] = useState<string>("0");
  const [editPlatformCommission, setEditPlatformCommission] = useState<string>("0");

  // Modal state for deletion
  const [deleteVenueId, setDeleteVenueId] = useState<string | null>(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Modal state for confirmation
  const [confirmVenueId, setConfirmVenueId] = useState<string | null>(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmVenueDetails, setConfirmVenueDetails] = useState<Venue | null>(null);

  // Modal state for rejection
  const [rejectVenueId, setRejectVenueId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectVenueDetails, setRejectVenueDetails] = useState<Venue | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [rejectConfirmInput, setRejectConfirmInput] = useState("");

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "venues"),
        orderBy("createdAt", "desc"),
        limit(500)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as Venue[];
      setVenues(list);
      
      // Also fetch archived venues
      const archivedQ = query(
        collection(db, "archivedVenues"),
        orderBy("archivedAt", "desc"),
        limit(500)
      );
      const archivedSnap = await getDocs(archivedQ);
      const archivedList = archivedSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as ArchivedVenue[];
      setArchivedVenues(archivedList);
    } catch (err) {
      console.error("Failed to load venues", err);
      toast.error("Failed to load venues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newName.trim()) {
      toast.error("Please provide a name for the venue.");
      return;
    }
    setCreating(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");
      const advanceValue = Math.max(0, Math.min(100, parseFloat(newAdvancePercent) || 0));
      const platformValue = Math.max(0, Math.min(100, parseFloat(newPlatformCommission) || 0));
      const res = await fetch("/api/venues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName.trim(),
          address: newAddress.trim() || null,
          advancePercentage: advanceValue,
          platformCommission: platformValue,
          pricePerHour: 0,
          slotConfig: { slotDuration: 60, openTime: "06:00", closeTime: "22:00" },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed");
      setNewName("");
      setNewAddress("");
      setNewAdvancePercent(String(DEFAULT_ADVANCE_PERCENT));
      setNewPlatformCommission("0");
      toast.success("Venue created");
      fetchVenues();
    } catch (err: any) {
      console.error("Create venue failed", err);
      toast.error(err?.message || "Failed to create venue");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (v: Venue) => {
    setEditingId(v.id);
    setEditName(v.name ?? "");
    setEditAddress(v.address ?? "");
    setEditAdvancePercent(String(v.advancePercentage ?? DEFAULT_ADVANCE_PERCENT));
    setEditPlatformCommission(String(v.platformCommission ?? 0));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSavingId(null);
    setEditName("");
    setEditAddress("");
    setEditAdvancePercent("0");
    setEditPlatformCommission("0");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) {
      toast.error("Venue name cannot be empty.");
      return;
    }
    setSavingId(id);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");
      const advanceValue = Math.max(0, Math.min(100, parseFloat(editAdvancePercent) || 0));
      const platformValue = Math.max(0, Math.min(100, parseFloat(editPlatformCommission) || 0));
      const res = await fetch(`/api/venues/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName.trim(),
          address: editAddress.trim() || null,
          advancePercentage: advanceValue,
          platformCommission: platformValue,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      toast.success("Venue updated");
      cancelEdit();
      fetchVenues();
    } catch (err: any) {
      const msg = err?.message || "Failed to update venue";
      console.error("Update venue failed", err);
      toast.error(msg);
    } finally {
      setSavingId(null);
    }
  };

  const handleStatusUpdate = async (id: string, status: "approved" | "rejected" | "pending", rejectionReason?: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");
      
      // If rejecting, archive the venue instead of just updating status
      if (status === "rejected" && rejectionReason) {
        const res = await fetch("/api/venues/archive", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            venueId: id,
            reason: rejectionReason,
            archivedStatus: "rejected",
          }),
        });
        const text = await res.text();
        if (!text) throw new Error(`Empty response from server (status: ${res.status})`);
        const data = JSON.parse(text);
        if (!res.ok) throw new Error(data.error || "Rejection failed");
        toast.success("Venue rejected and archived");
        setVenues((p) => p.filter((v) => v.id !== id));
        return;
      }
      
      // For approved/pending status, just update the status field
      const body: any = { status };
      const res = await fetch(`/api/venues/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      if (!text) throw new Error(`Empty response from server (status: ${res.status})`);
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error || "Status update failed");
      toast.success(`Venue ${status === "approved" ? "approved" : status === "pending" ? "set to pending" : "rejected"}`);
      fetchVenues();
    } catch (err: any) {
      console.error("Status update error:", err);
      toast.error(err?.message || "Failed to update status");
    }
  };

  const openDeleteModal = (id: string) => {
    setDeleteVenueId(id);
    setDeleteInput("");
    setDeleteReason("");
    setShowDeleteModal(true);
  };

  const handleDeleteVenue = async () => {
    if (deleteInput !== "DELETE") {
      toast.error("Type DELETE to confirm deletion.");
      return;
    }
    if (!deleteReason.trim()) {
      toast.error("Please provide a reason for deletion.");
      return;
    }
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");
      // Archive venue with deletion reason
      const res = await fetch("/api/venues/archive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          venueId: deleteVenueId,
          reason: deleteReason,
          archivedStatus: "deleted",
        }),
      });
      
      const text = await res.text();
      if (!text) {
        throw new Error(`Empty response from server (status: ${res.status})`);
      }
      
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Invalid JSON response: ${text}`);
      }
      
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast.success("Venue deleted and archived");
      setVenues((p) => p.filter((v) => v.id !== deleteVenueId));
      setShowDeleteModal(false);
      setDeleteInput("");
      setDeleteReason("");
      setDeleteVenueId(null);
    } catch (err: any) {
      console.error("Delete venue error:", err);
      toast.error(err?.message || "Failed to delete venue");
    }
  };

  const openConfirmModal = (venue: Venue) => {
    setConfirmVenueId(venue.id);
    setConfirmInput("");
    setShowConfirmModal(true);
    setConfirmVenueDetails(venue);
  };

  const handleConfirmVenue = async () => {
    if (confirmInput !== "CONFIRM") {
      toast.error("Type CONFIRM to approve venue.");
      return;
    }
    await handleStatusUpdate(confirmVenueId!, "approved");
    setShowConfirmModal(false);
  };

  const openRejectModal = (venue: Venue) => {
    setRejectVenueId(venue.id);
    setRejectVenueDetails(venue);
    setRejectReasonInput("");
    setRejectConfirmInput("");
    setShowRejectModal(true);
  };

  const handleRejectVenue = async () => {
    if (rejectConfirmInput !== "REJECT") {
      toast.error("Type REJECT to confirm rejection.");
      return;
    }
    if (!rejectReasonInput.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    await handleStatusUpdate(rejectVenueId!, "rejected", rejectReasonInput);
    setShowRejectModal(false);
  };

  const handleRestoreVenue = async (venueId: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");
      
      // Restore venue by calling the restore endpoint
      const res = await fetch("/api/venues/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          venueId: venueId,
        }),
      });
      const text = await res.text();
      if (!text) throw new Error(`Empty response from server (status: ${res.status})`);
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error || "Restore failed");
      toast.success("Venue restored");
      fetchVenues();
    } catch (err: any) {
      console.error("Restore venue error:", err);
      toast.error(err?.message || "Failed to restore venue");
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Venues</h1>
          <p className="text-muted-foreground">Manage venues used in the system</p>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Venues</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{venues.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Venues List</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchVenues}>
              Refresh
            </Button>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">Active Venues ({venues.length})</TabsTrigger>
                <TabsTrigger value="archived">Archived ({archivedVenues.length})</TabsTrigger>
              </TabsList>

              {/* Active Venues Tab */}
              <TabsContent value="active" className="space-y-4">
                <form
                  onSubmit={handleCreate}
                  className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-4"
                >
                  <div className="sm:col-span-1">
                    <Input
                      placeholder="Venue name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      aria-label="Venue name"
                      required
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Input
                      placeholder="Address (optional)"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      aria-label="Venue address"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Input
                      type="number"
                      placeholder="Advance % (user pays online)"
                      value={newAdvancePercent}
                      onChange={(e) => setNewAdvancePercent(e.target.value)}
                      aria-label="Advance percentage"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Input
                      type="number"
                      placeholder="Platform commission %"
                      value={newPlatformCommission}
                      onChange={(e) => setNewPlatformCommission(e.target.value)}
                      aria-label="Platform commission percentage"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-center gap-2">
                    <Button type="submit" disabled={creating}>
                      {creating ? "Creating…" : "Create venue"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setNewName("");
                        setNewAddress("");
                        setNewAdvancePercent(String(DEFAULT_ADVANCE_PERCENT));
                        setNewPlatformCommission("0");
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </form>

                <Separator className="my-4" />

                {loading ? (
                  <div className="text-sm text-muted-foreground py-6">
                    Loading venues…
                  </div>
                ) : venues.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-6">
                    No venues found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Advance % (online)</TableHead>
                          <TableHead>Platform Commission %</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {venues.map((v) => (
                          <TableRow key={v.id}>
                            <TableCell className="w-1/3">
                              {editingId === v.id ? (
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                />
                              ) : (
                                <div className="font-medium">{v.name ?? "—"}</div>
                              )}
                            </TableCell>

                            <TableCell>
                              {editingId === v.id ? (
                                <Input
                                  value={editAddress}
                                  onChange={(e) => setEditAddress(e.target.value)}
                                />
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  {v.address ? (v.address.length > 50 ? `${v.address.substring(0, 50)}...` : v.address) : "—"}
                                </div>
                              )}
                            </TableCell>

                            <TableCell>
                              {editingId === v.id ? (
                                <Input
                                  type="number"
                                  value={editAdvancePercent}
                                  onChange={(e) => setEditAdvancePercent(e.target.value)}
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  aria-label="Advance percentage"
                                />
                              ) : (
                                <div className="text-sm font-medium">
                                  {v.advancePercentage ?? DEFAULT_ADVANCE_PERCENT}%
                                </div>
                              )}
                            </TableCell>

                            <TableCell>
                              {editingId === v.id ? (
                                <Input
                                  type="number"
                                  value={editPlatformCommission}
                                  onChange={(e) => setEditPlatformCommission(e.target.value)}
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  aria-label="Platform commission percentage"
                                />
                              ) : (
                                <div className="text-sm font-medium">
                                  {v.platformCommission ?? 0}%
                                </div>
                              )}
                            </TableCell>

                            <TableCell>
                              <div className="text-sm font-medium">
                                {v.status === "pending" && <span className="text-yellow-600">Pending</span>}
                                {v.status === "approved" && <span className="text-green-600">Approved</span>}
                                {v.status === "rejected" && <span className="text-red-600">Rejected</span>}
                                {!v.status && <span className="text-gray-500">—</span>}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2">
                                {editingId === v.id ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveEdit(v.id)}
                                      disabled={savingId === v.id}
                                    >
                                      {savingId === v.id ? "Saving…" : "Save"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={cancelEdit}
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button size="sm" onClick={() => startEdit(v)}>
                                      Edit
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => openDeleteModal(v.id)}>Delete</Button>
                                    {v.status === "pending" && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => openConfirmModal(v)}
                                        >
                                          Approve
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => openRejectModal(v)}
                                        >
                                          Reject
                                        </Button>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* Archived Venues Tab */}
              <TabsContent value="archived" className="space-y-4">
                {loading ? (
                  <div className="text-sm text-muted-foreground py-6">
                    Loading archived venues…
                  </div>
                ) : archivedVenues.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-6">
                    No archived venues found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Archive Reason</TableHead>
                          <TableHead>Archive Type</TableHead>
                          <TableHead>Archived At</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {archivedVenues.map((v) => (
                          <TableRow key={v.id}>
                            <TableCell className="w-1/4">
                              <div className="font-medium">{v.name ?? "—"}</div>
                            </TableCell>

                            <TableCell>
                              <div
                                className="text-sm text-muted-foreground"
                                title={v.address ?? "—"}
                              >
                                {v.address ? (v.address.length > 50 ? `${v.address.substring(0, 50)}...` : v.address) : "—"}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div
                                className="text-sm"
                                title={v.archivalReason ?? "—"}
                              >
                                {v.archivalReason ? (v.archivalReason.length > 50 ? `${v.archivalReason.substring(0, 50)}...` : v.archivalReason) : "—"}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="text-sm font-medium">
                                {v.archivedStatus === "deleted" && <span className="text-red-600">Deleted</span>}
                                {v.archivedStatus === "rejected" && <span className="text-orange-600">Rejected</span>}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {v.archivedAt ? new Date(v.archivedAt.toDate?.()).toLocaleDateString() : "—"}
                              </div>
                            </TableCell>

                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRestoreVenue(v.id)}
                                className="flex items-center gap-1"
                              >
                                <RotateCcw className="w-4 h-4" />
                                Restore
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete Venue</h2>
            <p className="mb-2">Type <span className="font-mono font-bold">DELETE</span> to confirm deletion.</p>
            <Input value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder="Type DELETE" className="mb-3" />
            <p className="mb-2">Reason for deletion:</p>
            <Input value={deleteReason} onChange={e => setDeleteReason(e.target.value)} placeholder="Reason" className="mb-3" />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteVenue}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && confirmVenueDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Approve Venue</h2>
            <div className="mb-4 space-y-3">
              <div>
                <div className="font-bold">Name:</div>
                <div>{confirmVenueDetails.name}</div>
              </div>
              <div>
                <div className="font-bold">Address:</div>
                <div>{confirmVenueDetails.address}</div>
              </div>
              <div>
                <div className="font-bold">Advance %:</div>
                <div>{confirmVenueDetails.advancePercentage ?? DEFAULT_ADVANCE_PERCENT}%</div>
              </div>
              <div>
                <div className="font-bold">Platform Commission %:</div>
                <div>{confirmVenueDetails.platformCommission ?? 0}%</div>
              </div>
              <div>
                <div className="font-bold">Status:</div>
                <div>{confirmVenueDetails.status}</div>
              </div>
              {/* Show images if available */}
              {confirmVenueDetails.imageUrls && confirmVenueDetails.imageUrls.length > 0 && (
                <div>
                  <div className="font-bold mb-2">Images:</div>
                  <div className="flex gap-2 flex-wrap">
                    {confirmVenueDetails.imageUrls.map((url: string, idx: number) => (
                      <img key={idx} src={url} alt="Venue" className="w-20 h-20 object-cover rounded" />
                    ))}
                  </div>
                </div>
              )}
              {/* Show location if available */}
              {confirmVenueDetails.location && (
                <div>
                  <div className="font-bold">Location:</div>
                  <div className="text-sm">{JSON.stringify(confirmVenueDetails.location)}</div>
                </div>
              )}
            </div>
            <p className="mb-2">Type <span className="font-mono font-bold">CONFIRM</span> to approve this venue.</p>
            <Input value={confirmInput} onChange={e => setConfirmInput(e.target.value)} placeholder="Type CONFIRM" className="mb-3" />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
              <Button variant="default" onClick={handleConfirmVenue}>Approve</Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && rejectVenueDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Reject Venue</h2>
            <div className="mb-4 space-y-3">
              <div>
                <div className="font-bold">Name:</div>
                <div>{rejectVenueDetails.name}</div>
              </div>
              <div>
                <div className="font-bold">Address:</div>
                <div>{rejectVenueDetails.address}</div>
              </div>
              <div>
                <div className="font-bold">Advance %:</div>
                <div>{rejectVenueDetails.advancePercentage ?? DEFAULT_ADVANCE_PERCENT}%</div>
              </div>
              <div>
                <div className="font-bold">Platform Commission %:</div>
                <div>{rejectVenueDetails.platformCommission ?? 0}%</div>
              </div>
              <div>
                <div className="font-bold">Status:</div>
                <div>{rejectVenueDetails.status}</div>
              </div>
              {/* Show images if available */}
              {rejectVenueDetails.imageUrls && rejectVenueDetails.imageUrls.length > 0 && (
                <div>
                  <div className="font-bold mb-2">Images:</div>
                  <div className="flex gap-2 flex-wrap">
                    {rejectVenueDetails.imageUrls.map((url: string, idx: number) => (
                      <img key={idx} src={url} alt="Venue" className="w-20 h-20 object-cover rounded" />
                    ))}
                  </div>
                </div>
              )}
              {/* Show location if available */}
              {rejectVenueDetails.location && (
                <div>
                  <div className="font-bold">Location:</div>
                  <div className="text-sm">{JSON.stringify(rejectVenueDetails.location)}</div>
                </div>
              )}
            </div>
            <p className="mb-2">Type <span className="font-mono font-bold">REJECT</span> to confirm rejection.</p>
            <Input value={rejectConfirmInput} onChange={e => setRejectConfirmInput(e.target.value)} placeholder="Type REJECT" className="mb-3" />
            <p className="mb-2">Reason for rejection:</p>
            <Input value={rejectReasonInput} onChange={e => setRejectReasonInput(e.target.value)} placeholder="Reason" className="mb-3" />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowRejectModal(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleRejectVenue}>Reject</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
