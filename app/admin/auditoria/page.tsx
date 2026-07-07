import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { requireUser } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  await requireUser(ADMIN_ROLES);

  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Auditoria"
        title="Registro de acciones"
        description="Historial de eventos relevantes en autenticacion, catalogo, ventas y operaciones."
      />

      <div className="admin-surface overflow-hidden">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Fecha</TableHeaderCell>
              <TableHeaderCell>Usuario</TableHeaderCell>
              <TableHeaderCell>Accion</TableHeaderCell>
              <TableHeaderCell>Entidad</TableHeaderCell>
              <TableHeaderCell>Metadata</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{formatDate(log.createdAt)}</TableCell>
                <TableCell>{log.user?.email || "Sistema"}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>
                  {log.entity}
                  {log.entityId ? ` · ${log.entityId}` : ""}
                </TableCell>
                <TableCell>
                  <pre className="max-w-[360px] whitespace-pre-wrap break-all text-xs text-slate-600">
                    {log.metadata ? JSON.stringify(log.metadata, null, 2) : "-"}
                  </pre>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
