# Venue Archiving System Implementation

## Overview
This implementation adds a comprehensive venue archiving system that moves deleted and rejected venues to an `archivedVenues` collection instead of permanently deleting them. This provides better audit trails, restore capabilities, and data preservation.

## Architecture

### Collections
- **venues**: Active venues (pending, approved, or pending re-approval after restore)
- **archivedVenues**: Archived venues with metadata about why they were archived
- **venueDeletionLogs**: Audit log specifically for deletions (preserved for compliance)

### Venue Statuses
- **pending**: New venue awaiting admin approval
- **approved**: Venue approved and visible to users
- **rejected**: Venue rejected by admin (moved to archived)

## API Endpoints

### 1. POST /api/venues/archive
Archives a venue by moving it from `venues` to `archivedVenues` collection.

**Request:**
```json
{
  "venueId": "string",
  "reason": "string",
  "archivedStatus": "deleted" | "rejected"
}
```

**Behavior:**
- Only admins can archive venues
- Preserves all original venue data
- Adds metadata: `originalId`, `archivedStatus`, `archivalReason`, `archivedBy`, `archivedAt`
- If `archivedStatus` is "deleted", also logs to `venueDeletionLogs`
- Deletes the original venue document

### 2. POST /api/venues/restore
Restores an archived venue back to the active venues collection.

**Request:**
```json
{
  "venueId": "string"
}
```

**Behavior:**
- Only admins can restore venues
- Removes all archival metadata
- Sets status to "pending" (requires re-approval)
- Adds metadata: `restoredAt`, `restoredBy`
- Deletes the archived venue document

## Admin Panel Changes

### Tabs
The admin venues page now has two tabs:

1. **Active Venues Tab**
   - Lists all venues in the `venues` collection
   - Form to create new venues
   - CRUD operations: Edit, Delete (archive), Approve, Reject
   - Delete requires typing "DELETE" + reason
   - Approve requires typing "CONFIRM" after reviewing full details
   - Reject requires typing "REJECT" + reason after reviewing full details

2. **Archived Venues Tab**
   - Lists all venues in the `archivedVenues` collection
   - Columns: Name, Address, Archive Reason, Archive Type, Archived At, Actions
   - Archive Type shows "Deleted" or "Rejected"
   - Restore button to move venue back to active venues

## Data Schema

### Archived Venue Document
```typescript
{
  // Original venue fields (all preserved)
  id: string,
  name: string,
  address: string,
  advancePercentage: number,
  platformCommission: number,
  imageUrls: string[],
  location: object,
  status: string,
  // ... all other original fields
  
  // Archival metadata
  originalId: string,
  archivedStatus: "deleted" | "rejected",
  archivalReason: string,
  archivedBy: string,
  archivedAt: Timestamp
}
```

### Restored Venue Document
When restored, the venue includes:
```typescript
{
  // All original fields except archival metadata
  status: "pending",  // Reset to pending for re-approval
  restoredAt: Timestamp,
  restoredBy: string
}
```

## User Flows

### Delete Venue
1. Admin clicks Delete on a venue
2. Modal appears requiring:
   - Type "DELETE" to confirm
   - Provide a deletion reason
3. Venue is moved to archivedVenues with `archivedStatus: "deleted"`
4. Entry added to venueDeletionLogs for audit trail

### Reject Venue (Pending)
1. Admin clicks Reject on a pending venue
2. Modal appears showing full venue details (images, location, etc.)
3. Requires:
   - Type "REJECT" to confirm
   - Provide a rejection reason
4. Venue is moved to archivedVenues with `archivedStatus: "rejected"`

### Restore Venue
1. Admin navigates to Archived Venues tab
2. Clicks Restore button on the archived venue
3. Venue is moved back to venues collection
4. Status is set to "pending" (requires re-approval)

## Implementation Details

### File Changes

**New Files:**
- `/app/api/venues/archive.ts` - Archive endpoint
- `/app/api/venues/restore.ts` - Restore endpoint

**Modified Files:**
- `/app/admin/venues/page.tsx`:
  - Added `archivedVenues` state
  - Added `activeTab` state to manage tab switching
  - Updated `fetchVenues()` to also fetch archived venues
  - Updated `handleDeleteVenue()` to call `/api/venues/archive` instead of DELETE
  - Updated `handleStatusUpdate()` to call `/api/venues/archive` for rejections
  - Added `handleRestoreVenue()` function
  - Added Tabs component with Active and Archived tabs
  - Archived venues tab displays archival metadata

### Status Transitions
```
New Venue (pending)
  ├→ Approved (admin) → approved
  └→ Rejected (admin) → archived (archivedStatus: "rejected")

Archived Venue
  └→ Restored (admin) → pending (requires re-approval)
```

## Audit Trail
- All deletions are logged in `venueDeletionLogs` with: venueId, reason, deletedBy, deletedAt
- All archival events are tracked in archivedVenues with: archivalReason, archivedBy, archivedAt
- All restore events are tracked in venues with: restoredAt, restoredBy

## Security & Permissions
- Only admins can archive venues
- Only admins can restore venues
- Admin actions require explicit confirmation (type confirmation strings)
- All operations are logged with admin user ID

## Future Enhancements
- Bulk restore functionality
- Advanced filtering by archive reason or date range
- Archive reason templates
- Automatic archival after retention period
- Archive deletion (permanent removal)
