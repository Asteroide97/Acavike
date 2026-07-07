import { AdminFlash } from "@/components/admin/admin-flash";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { updateUserRoleAction } from "@/lib/actions/admin";
import { requireUser } from "@/lib/auth";
import { ADMIN_ROLES, USER_ROLE_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser(ADMIN_ROLES);
  const resolvedSearchParams = await searchParams;

  const users = await prisma.user.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Usuarios"
        title="Roles y accesos"
        description="Controla el rol operativo de cada cuenta y su relacion con clientes."
      />

      <AdminFlash searchParams={resolvedSearchParams} />

      <div className="admin-surface overflow-hidden">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Usuario</TableHeaderCell>
              <TableHeaderCell>Correo</TableHeaderCell>
              <TableHeaderCell>Cliente</TableHeaderCell>
              <TableHeaderCell>Alta</TableHeaderCell>
              <TableHeaderCell>Rol</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.customer?.companyName || "Sin perfil cliente"}</TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
                <TableCell>
                  <form action={updateUserRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <Select name="role" defaultValue={user.role} className="min-w-[170px]">
                      {Object.entries(USER_ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                    <button className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
                      Guardar
                    </button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
