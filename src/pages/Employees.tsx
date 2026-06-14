import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import {
  Plus,
  Search,
  Download,
  Pencil,
  Receipt,
  Power,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TopBar } from '@/components/layout/TopBar';
import { PageBody } from '@/components/layout/AppShell';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { Input, Select } from '@/components/shared/Input';
import { Avatar } from '@/components/shared/Avatar';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import type { Employee } from '@/types';
import { useEmployeeStore } from '@/store/useEmployeeStore';
import { useLicenseStore } from '@/store/useLicenseStore';
import { isMissingTFN } from '@/lib/payroll';
import { employeeCap, BUY_URL, TIER_META } from '@/lib/license';
import { exportEmployeesXLSX } from '@/lib/export/excel';
import { formatPGK, cn } from '@/lib/utils';

const col = createColumnHelper<Employee>();

const STATUS_TONE = { active: 'success', inactive: 'neutral', terminated: 'danger' } as const;

export function Employees() {
  const navigate = useNavigate();
  const employees = useEmployeeStore((s) => s.employees);
  const setStatus = useEmployeeStore((s) => s.setStatus);
  const license = useLicenseStore((s) => s.status);

  const cap = employeeCap(license);
  const activeCount = employees.filter((e) => e.status === 'active').length;
  const atCap = cap > 0 && activeCount >= cap;

  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('all');
  const [type, setType] = useState('all');
  const [status, setStatusFilter] = useState('active');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [toggling, setToggling] = useState<Employee | null>(null);

  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department))).sort(),
    [employees],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (status !== 'all' && e.status !== status) return false;
      if (dept !== 'all' && e.department !== dept) return false;
      if (type !== 'all' && e.employmentType !== type) return false;
      if (q) {
        const hay = `${e.firstName} ${e.lastName} ${e.employeeNumber} ${e.department} ${e.position}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [employees, search, dept, type, status]);

  const columns = useMemo(
    () => [
      col.display({
        id: 'index',
        header: '#',
        cell: (info) => <span className="tnum text-faint">{info.row.index + 1}</span>,
      }),
      col.accessor((e) => `${e.firstName} ${e.lastName}`, {
        id: 'name',
        header: 'Name',
        cell: (info) => {
          const e = info.row.original;
          return (
            <div className="flex items-center gap-2.5">
              <Avatar first={e.firstName} last={e.lastName} seed={e.department} size={30} />
              <div>
                <div className="font-medium text-ink">{e.firstName} {e.lastName}</div>
                <div className="text-[11px] text-faint">{e.position}</div>
              </div>
            </div>
          );
        },
      }),
      col.accessor('employeeNumber', { header: 'Emp #', cell: (i) => <span className="font-mono text-[12px] text-muted">{i.getValue()}</span> }),
      col.accessor('department', { header: 'Department', cell: (i) => <span className="text-muted">{i.getValue()}</span> }),
      col.accessor('grossFortnightlySalary', {
        header: () => <div className="text-right">Fortnightly</div>,
        cell: (i) => <div className="tnum text-right text-ink">{formatPGK(i.getValue())}</div>,
      }),
      col.accessor('employmentType', {
        header: 'Type',
        cell: (i) => <span className="capitalize text-muted">{i.getValue()}</span>,
      }),
      col.accessor('nasfundMember', {
        header: () => <div className="text-center">Nasfund</div>,
        cell: (i) => (
          <div className="flex justify-center">
            {i.getValue() ? <Check size={15} className="text-success" /> : <X size={15} className="text-faint" />}
          </div>
        ),
      }),
      col.accessor('status', {
        header: 'Status',
        cell: (i) => {
          const e = i.row.original;
          return (
            <div className="flex items-center gap-1.5">
              <Badge tone={STATUS_TONE[e.status]} className="capitalize">
                {e.status}
              </Badge>
              {isMissingTFN(e) && e.status === 'active' && (
                <span title="No TFN — taxed at 42%">
                  <Badge tone="warning">No TFN</Badge>
                </span>
              )}
            </div>
          );
        },
      }),
      col.display({
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: (info) => {
          const e = info.row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <IconBtn title="Edit" onClick={() => { setEditing(e); setFormOpen(true); }}>
                <Pencil size={15} />
              </IconBtn>
              <IconBtn title="Payslip history" onClick={() => navigate(`/payslips?emp=${e.id}`)}>
                <Receipt size={15} />
              </IconBtn>
              <IconBtn title={e.status === 'active' ? 'Deactivate' : 'Reactivate'} onClick={() => setToggling(e)}>
                <Power size={15} className={e.status === 'active' ? '' : 'text-success'} />
              </IconBtn>
            </div>
          );
        },
      }),
    ],
    [navigate],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  const openAdd = () => {
    if (atCap) {
      const tierLabel = license?.payload ? TIER_META[license.payload.tier].label : 'current';
      toast.error(`${tierLabel} plan limit reached (${cap} active staff). Upgrade to add more.`);
      return;
    }
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <>
      <TopBar
        title="Employees"
        subtitle={`${employees.filter((e) => e.status === 'active').length} active • ${employees.length} total`}
        actions={
          <>
            <Button variant="outline" icon={<Download size={15} />} onClick={() => exportEmployeesXLSX(filtered)}>
              Export
            </Button>
            <Button icon={<Plus size={15} />} onClick={openAdd}>
              Add Employee
            </Button>
          </>
        }
      />
      <PageBody>
        {cap > 0 && (
          <div
            className={cn(
              'mb-4 flex flex-wrap items-center justify-between gap-2 rounded-[6px] border px-4 py-2.5 text-[12px]',
              atCap ? 'border-warning/40 bg-warning/10 text-warning' : 'border-line bg-card text-muted',
            )}
          >
            <span>
              {license?.payload ? TIER_META[license.payload.tier].label : 'Licence'} plan ·{' '}
              <span className="font-semibold text-ink">{activeCount}</span> of {cap} active staff used
              {atCap && ' — limit reached'}
            </span>
            {atCap && (
              <Button variant="gold" size="sm" onClick={() => window.open(BUY_URL, '_blank')}>
                Upgrade plan
              </Button>
            )}
          </div>
        )}
        <Card className="mb-4 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, number, department…"
                className="pl-9"
              />
            </div>
            <Select value={dept} onChange={(e) => setDept(e.target.value)} className="w-auto min-w-[150px]">
              <option value="all">All departments</option>
              {departments.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
            <Select value={type} onChange={(e) => setType(e.target.value)} className="w-auto min-w-[140px]">
              <option value="all">All types</option>
              <option value="permanent">Permanent</option>
              <option value="casual">Casual</option>
              <option value="contract">Contract</option>
              <option value="part-time">Part-time</option>
            </Select>
            <Select value={status} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto min-w-[130px]">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </Select>
          </div>
        </Card>

        <Card>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Users size={32} />}
              title="No employees found"
              message="Adjust your filters, or add a new employee to get started."
              action={<Button icon={<Plus size={15} />} onClick={openAdd}>Add Employee</Button>}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id} className="border-b border-line text-left text-[11px] uppercase tracking-wide text-faint">
                        {hg.headers.map((h) => (
                          <th
                            key={h.id}
                            onClick={h.column.getToggleSortingHandler()}
                            className={cn('px-4 py-2.5 font-medium', h.column.getCanSort() && 'cursor-pointer select-none')}
                          >
                            {flexRender(h.column.columnDef.header, h.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="border-b border-line/60 transition-colors hover:bg-card-2">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-2.5 align-middle">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-line px-4 py-3 text-[12px] text-muted">
                <span>
                  Showing {table.getRowModel().rows.length} of {filtered.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} icon={<ChevronLeft size={14} />}>
                    Prev
                  </Button>
                  <span className="tnum">
                    {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} iconRight={<ChevronRight size={14} />}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </PageBody>

      {formOpen && <EmployeeForm open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />}

      <ConfirmDialog
        open={!!toggling}
        onClose={() => setToggling(null)}
        onConfirm={() => {
          if (toggling) {
            const next = toggling.status === 'active' ? 'inactive' : 'active';
            setStatus(toggling.id, next);
            toast.success(`${toggling.firstName} ${next === 'active' ? 'reactivated' : 'deactivated'}`);
          }
          setToggling(null);
        }}
        title={toggling?.status === 'active' ? 'Deactivate employee?' : 'Reactivate employee?'}
        confirmLabel={toggling?.status === 'active' ? 'Deactivate' : 'Reactivate'}
        danger={toggling?.status === 'active'}
        message={
          toggling?.status === 'active'
            ? `${toggling?.firstName} ${toggling?.lastName} will be excluded from new payroll runs but their history is kept.`
            : `${toggling?.firstName} ${toggling?.lastName} will be available for payroll runs again.`
        }
      />
    </>
  );
}

function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="rounded-[4px] p-1.5 text-muted hover:bg-surface-hover hover:text-ink"
    >
      {children}
    </button>
  );
}
