"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Protected } from "@/components/app/protected";
import { PageHeader, EmptyState, LoadingState, Alert, ErrorState } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { usersApi } from "@/lib/api/users";
import { toUserMessage } from "@/lib/api/client";
import type { PaginationMeta, User } from "@/lib/api/types";
import { formatDateTime } from "@/lib/utils";

function UsersInner() {
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    usersApi
      .list({ page, size: 20 })
      .then((result) => {
        setUsers(result.documents);
        setMeta(result.meta);
        setError("");
      })
      .catch((err) => setError(toUserMessage(err, "Unable to load users.")))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader title="Users" description="Paginated directory. Default page size 20, maximum 100." />
      {error && users.length === 0 && !loading ? <ErrorState message={error} onRetry={load} /> : null}
      {error && users.length > 0 ? <Alert tone="error">{error}</Alert> : null}
      {loading && users.length === 0 ? (
        <LoadingState />
      ) : !error && users.length === 0 ? (
        <EmptyState title="No users" description="No accounts have been created yet." />
      ) : users.length > 0 ? (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-line bg-surface">
          <table className="min-w-[36rem] text-left text-sm">
            <thead className="border-b border-line text-subtle">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <Link className="hover:text-harvest" href={`/admin/users/${user._id}`}>
                      {user.username}
                    </Link>
                    <div className="break-all text-subtle">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDateTime(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {meta ? <Pagination meta={meta} onPage={setPage} /> : null}
    </>
  );
}

export default function AdminUsersPage() {
  return (
    <Protected admin>
      <UsersInner />
    </Protected>
  );
}
