"use client";

// Development tester page removed.
// This page previously allowed direct Firestore writes (venues, bookings)
// and was intended for local development only. It has been removed to
// prevent accidental use in production environments. If you need similar
// functionality locally, recreate a local-only script or gate this page
// behind an environment flag.

export default function TesterPage(): null {
                    );
                    await Promise.all(deletes);
                    alert("All bookings removed.");
                  } catch (err) {
                    console.error(err);
                    alert("Failed to delete bookings.");
                  }
                }}
              >
                Clear all bookings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
