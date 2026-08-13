/**
 * Domain types for the admin surface. These mirror the intended Supabase tables
 * (see AGENTS.md section 5) closely enough that swapping the mock data source for
 * real typed queries is a data-source change, not a shape change.
 */

export type RegistrationStatus = "confirmed" | "pending" | "cancelled";
export type PaymentStatus = "paid" | "partial" | "unpaid";
export type UserRole = "superadmin" | "admin";
export type LogLevel = "info" | "warning" | "error";

export type Registration = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  campId: string;
  priceTierId: string;
  registeredAt: string; // ISO date
  status: RegistrationStatus;
  payment: PaymentStatus;
  amountDue: number; // whole euros
  amountPaid: number; // whole euros
  deleted: boolean;
  formData: Record<string, unknown>; // dynamic answers keyed by CampFormField.key
};

export type PriceTier = {
  id: string;
  name: string;
  price: number; // whole euros
  hidden: boolean; // reachable only via invitation link
  count: number; // registrations on this tier
  validFrom: string | null; // ISO date-time, null = no lower bound
  validUntil: string | null; // ISO date-time, null = no upper bound
};

export type Camp = {
  id: string;
  name: string;
  location: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  capacity: number;
  registrations: number;
  basePrice: number; // whole euros
  isCurrent: boolean;
  registrationOpen: boolean;
  formFieldCount: number;
  roomCapacity: number | null; // limited room spots, null = unlimited/unset
  registrationOpensAt: string | null; // ISO date-time, drives the countdown
  registrationClosesAt: string | null; // ISO date-time
  paymentDueDate: string | null; // ISO date
  tagline: string | null;
  description: string | null;
  config: Record<string, unknown>; // escape hatch for future per-camp settings
};

/**
 * Raw camp form values as they leave the client dialog: every field is a string
 * (from `<input>`/`<textarea>`) except the boolean toggle. The server-side Zod
 * schema validates and coerces these into a `CampInput`.
 */
export type CampFormValues = {
  name: string;
  location: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  capacity: string;
  basePrice: string;
  roomCapacity: string;
  registrationOpen: boolean;
  registrationOpensAt: string; // datetime-local (YYYY-MM-DDTHH:mm)
  registrationClosesAt: string;
  paymentDueDate: string; // YYYY-MM-DD
  tagline: string;
  description: string;
};

/** Validated, row-ready camp payload (output of the Zod schema). */
export type CampInput = {
  name: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  capacity: number | null;
  basePrice: number; // whole euros
  roomCapacity: number | null;
  registrationOpen: boolean;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  paymentDueDate: string | null;
  tagline: string | null;
  description: string | null;
};

/** Server Action result: German error copy + optional per-field messages. */
export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type CampFormField = {
  id: string;
  campId: string;
  key: string;
  label: string;
  fieldType: string;
  required: boolean;
  options: unknown; // e.g. string[] for selects, null otherwise
  sortOrder: number;
  config: Record<string, unknown>; // placeholder, help text, validation, etc.
};

/** App-wide settings bag (camp_settings.settings), admin-editable without a deploy. */
export type AppSettings = Record<string, unknown>;

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[]; // permission keys, see PERMISSION_LABELS
  visibleTabs: string[]; // nav hrefs the admin may see
  status: "active" | "invited";
  lastActiveAt: string | null; // ISO date, null for pending invites
};

export type LogEntry = {
  id: string;
  level: LogLevel;
  actor: string;
  action: string;
  message: string;
  createdAt: string; // ISO date-time
};

export type FinanceSummary = {
  basePrice: number;
  expected: number;
  collected: number;
  outstanding: number;
  paidCount: number;
  totalCount: number;
};
