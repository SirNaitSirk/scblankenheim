"use client";

import {
  EnvelopeSimple,
  PencilSimple,
  Trash,
  UserPlus,
  UsersThree,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Menu } from "@/components/ui/menu";
import { AddUserDialog } from "@/components/admin/add-user-dialog";
import { InviteDialog } from "@/components/admin/invite-dialog";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/states";
import { UserFormDialog } from "@/components/admin/user-form-dialog";
import {
  addAdminUserAction,
  deleteAdminUserAction,
  inviteAdminUserAction,
  revokeInvitationAction,
  updateAdminUserAction,
} from "@/app/admin/benutzer/actions";
import { formatDate } from "@/lib/format";
import { PERMISSION_LABELS, ROLE_LABELS, de } from "@/lib/admin/messages";
import type {
  ActionResult,
  AddUserFormValues,
  AdminUser,
  AdminUserFormValues,
  InviteFormValues,
  PendingInvitation,
} from "@/lib/admin/types";

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS).length;

export function UsersBoard({
  users,
  pendingInvitations,
  currentUserId,
  isSuperadmin,
}: {
  users: AdminUser[];
  pendingInvitations: PendingInvitation[];
  currentUserId: string | null;
  isSuperadmin: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<PendingInvitation | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const runAction = useCallback(
    (action: Promise<ActionResult>, successMessage: string) => {
      startTransition(async () => {
        const result = await action;
        if (result.ok) {
          showToast(successMessage);
          router.refresh();
        } else {
          showToast(result.error);
        }
      });
    },
    [router, showToast],
  );

  const submitEdit = useCallback(
    (values: AdminUserFormValues): Promise<ActionResult> =>
      editTarget
        ? updateAdminUserAction(editTarget.id, values)
        : Promise.resolve({ ok: false, error: de.users.toast.error }),
    [editTarget],
  );

  const submitAdd = useCallback(
    (values: AddUserFormValues): Promise<ActionResult> =>
      addAdminUserAction(values),
    [],
  );

  const submitInvite = useCallback(
    (values: InviteFormValues): Promise<ActionResult> =>
      inviteAdminUserAction(values),
    [],
  );

  const onEditSuccess = useCallback(() => {
    showToast(de.users.toast.updated);
    setEditTarget(null);
    router.refresh();
  }, [router, showToast]);

  const onAddSuccess = useCallback(() => {
    showToast(de.users.toast.created);
    setAddOpen(false);
    router.refresh();
  }, [router, showToast]);

  const onInviteSuccess = useCallback(() => {
    showToast(de.users.toast.invited);
    setInviteOpen(false);
    router.refresh();
  }, [router, showToast]);

  return (
    <>
      <PageHeader
        title={de.users.title}
        description={de.users.description}
        actions={
          isSuperadmin ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInviteOpen(true)}
              >
                <EnvelopeSimple size={16} weight="regular" />
                {de.users.inviteShort}
              </Button>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <UserPlus size={16} weight="bold" />
                {de.users.addUser}
              </Button>
            </div>
          ) : undefined
        }
      />

      {users.length === 0 ? (
        <Card className="flex flex-col">
          <EmptyState
            icon={UsersThree}
            title={de.users.empty.title}
            description={de.users.empty.description}
          />
        </Card>
      ) : (
        <Card className="flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-6 py-3 text-left font-medium">
                    {de.users.columns.user}
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    {de.users.columns.role}
                  </th>
                  <th className="hidden px-6 py-3 text-left font-medium lg:table-cell">
                    {de.users.columns.permissions}
                  </th>
                  <th className="hidden px-6 py-3 text-left font-medium md:table-cell">
                    {de.users.columns.lastActive}
                  </th>
                  <th className="px-6 py-3 text-left font-medium">
                    {de.users.columns.status}
                  </th>
                  {isSuperadmin && (
                    <th className="px-6 py-3 text-right font-medium">
                      <span className="sr-only">{de.users.columns.actions}</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => {
                  const hasAll =
                    user.role === "superadmin" ||
                    user.permissions.length >= ALL_PERMISSIONS;
                  const isSelf = user.id === currentUserId;
                  return (
                    <tr key={user.id} className="align-top text-foreground">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-2 font-medium">
                            {user.name || user.email}
                            {isSelf && (
                              <Badge tone="neutral">{de.users.selfBadge}</Badge>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          tone={user.role === "superadmin" ? "paid" : "neutral"}
                        >
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </td>
                      <td className="hidden px-6 py-4 lg:table-cell">
                        {hasAll ? (
                          <span className="text-muted-foreground">
                            {de.users.allPermissions}
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {user.permissions.map((p) => (
                              <span
                                key={p}
                                className="rounded-sm bg-ink-100 px-2 py-0.5 text-xs text-ink-700"
                              >
                                {PERMISSION_LABELS[p] ?? p}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="hidden px-6 py-4 font-mono text-xs text-muted-foreground md:table-cell">
                        {user.lastActiveAt
                          ? formatDate(user.lastActiveAt)
                          : de.users.neverActive}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          tone={user.status === "active" ? "neutral" : "pending"}
                        >
                          {user.status === "active"
                            ? de.users.statusActive
                            : de.users.statusInvited}
                        </Badge>
                      </td>
                      {isSuperadmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end">
                            <Menu
                              label={de.users.actions}
                              items={[
                                {
                                  label: de.users.edit,
                                  icon: PencilSimple,
                                  onSelect: () => setEditTarget(user),
                                },
                                // No self-delete: a superadmin must not lock
                                // themselves out.
                                ...(isSelf
                                  ? []
                                  : [
                                      {
                                        label: de.users.delete,
                                        icon: Trash,
                                        danger: true,
                                        onSelect: () => setDeleteTarget(user),
                                      },
                                    ]),
                              ]}
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {isSuperadmin && pendingInvitations.length > 0 && (
        <Card className="flex flex-col gap-1 p-6">
          <h2 className="font-display text-base font-bold tracking-tight text-foreground">
            {de.users.invitations.title}
          </h2>
          <div className="mt-3 flex flex-col divide-y divide-border">
            {pendingInvitations.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-foreground">
                    {invite.email}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {de.users.invitations.invitedOn} ·{" "}
                    {formatDate(invite.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    tone={invite.role === "superadmin" ? "paid" : "neutral"}
                  >
                    {ROLE_LABELS[invite.role]}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRevokeTarget(invite)}
                  >
                    {de.users.invitations.revoke}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <UserFormDialog
        key={editTarget?.id ?? "closed"}
        open={editTarget !== null}
        user={editTarget}
        isSelf={editTarget?.id === currentUserId}
        onClose={() => setEditTarget(null)}
        onSubmit={submitEdit}
        onSuccess={onEditSuccess}
      />

      <AddUserDialog
        key={addOpen ? "add-open" : "add-closed"}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={submitAdd}
        onSuccess={onAddSuccess}
      />

      <InviteDialog
        key={inviteOpen ? "invite-open" : "invite-closed"}
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={submitInvite}
        onSuccess={onInviteSuccess}
      />

      <DeleteUserDialog
        key={deleteTarget?.id ?? "none"}
        user={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={(user) => {
          setDeleteTarget(null);
          runAction(deleteAdminUserAction(user.id), de.users.toast.deleted);
        }}
      />

      <RevokeInviteDialog
        invite={revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={(invite) => {
          setRevokeTarget(null);
          runAction(revokeInvitationAction(invite.id), de.users.toast.revoked);
        }}
      />

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-pill bg-surface-inverse px-4 py-2 text-sm text-on-inverse shadow-pop"
        >
          {toast}
        </div>
      )}
    </>
  );
}

function DeleteUserDialog({
  user,
  onClose,
  onConfirm,
}: {
  user: AdminUser | null;
  onClose: () => void;
  onConfirm: (user: AdminUser) => void;
}) {
  // Remounted via `key` per target, so the field starts empty on each open.
  const [confirmEmail, setConfirmEmail] = useState("");
  const matches =
    user !== null &&
    confirmEmail.trim().toLowerCase() === user.email.trim().toLowerCase();

  return (
    <Dialog
      open={user !== null}
      onClose={onClose}
      title={de.users.remove.title}
      description={user ? de.users.remove.description(user.email) : undefined}
      closeLabel={de.users.remove.cancel}
      footer={
        <>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {de.users.remove.cancel}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={!matches}
            onClick={() => user && onConfirm(user)}
          >
            {de.users.remove.confirm}
          </Button>
        </>
      }
    >
      <Field label={de.users.remove.confirmHint} htmlFor="user-delete-confirm">
        <Input
          id="user-delete-confirm"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          placeholder={de.users.remove.confirmPlaceholder}
          autoComplete="off"
        />
      </Field>
    </Dialog>
  );
}

function RevokeInviteDialog({
  invite,
  onClose,
  onConfirm,
}: {
  invite: PendingInvitation | null;
  onClose: () => void;
  onConfirm: (invite: PendingInvitation) => void;
}) {
  const t = de.users.invitations.remove;
  return (
    <Dialog
      open={invite !== null}
      onClose={onClose}
      title={t.title}
      closeLabel={t.cancel}
      footer={
        <>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => invite && onConfirm(invite)}
          >
            {t.confirm}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        {invite ? t.description(invite.email) : null}
      </p>
    </Dialog>
  );
}
