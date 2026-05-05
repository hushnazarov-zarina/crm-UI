"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus, QrCode, Edit2, Trash2, Loader2, Printer, Copy, Search, Users as UsersIcon, RefreshCw,
} from "lucide-react";

interface Worker {
  id: string;
  full_name: string;
  employee_code: string;
  position: string | null;
  default_stage: string | null;
  default_stage_name: string | null;
  phone: string | null;
  is_active: boolean;
  has_active_qr: boolean;
  scans_7d: number;
  hired_at: string | null;
  created_at: string;
}

interface Stage { id: string; name_uz: string; sort_order: number; }

export default function WorkersPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("");

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [qrFor, setQrFor] = useState<Worker | null>(null);

  const { data, isLoading } = useQuery<Worker[]>({
    queryKey: ['workers'],
    queryFn: () => api.get('/api/workers'),
  });

  const { data: stages } = useQuery<Stage[]>({
    queryKey: ['stages'],
    queryFn: () => api.get('/api/master/stages'),
  });

  const filtered = (data || []).filter(w => {
    if (search && !w.full_name.toLowerCase().includes(search.toLowerCase())
        && !w.employee_code.toLowerCase().includes(search.toLowerCase())) return false;
    if (stageFilter && w.default_stage !== stageFilter) return false;
    return true;
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.del(`/api/workers/${id}`),
    onSuccess: () => {
      toast.success("Ishchi o'chirildi");
      qc.invalidateQueries({ queryKey: ['workers'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <UsersIcon className="h-7 w-7" /> Ishchilar
          </h1>
          <p className="text-muted-foreground">
            Ishchilar ro'yxati, QR badge yaratish va boshqarish
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => qc.invalidateQueries({ queryKey: ['workers'] })}>
            <RefreshCw className="mr-2 h-4 w-4" /> Yangilash
          </Button>
          {hasPermission('workers.create') && (
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="mr-2 h-4 w-4" /> Yangi ishchi
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ism, tabel bo'yicha qidirish..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={stageFilter || 'all'} onValueChange={(v) => setStageFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Bosqich" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha bosqichlar</SelectItem>
                {stages?.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name_uz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : !filtered.length ? (
            <div className="text-center py-12 text-muted-foreground">Ishchi topilmadi</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tabel</TableHead>
                  <TableHead>Ishchi</TableHead>
                  <TableHead>Lavozim</TableHead>
                  <TableHead>Bosqich</TableHead>
                  <TableHead className="text-center">7 kun scan</TableHead>
                  <TableHead className="text-center">QR</TableHead>
                  <TableHead className="text-center">Holat</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(w => (
                  <TableRow key={w.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      {w.employee_code}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {w.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{w.full_name}</div>
                          {w.phone && (
                            <div className="text-xs text-muted-foreground">{w.phone}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {w.position || '—'}
                    </TableCell>
                    <TableCell>
                      {w.default_stage_name ? (
                        <Badge variant="outline">{w.default_stage_name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {w.scans_7d > 0 ? w.scans_7d : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {w.has_active_qr ? (
                        <Badge variant="outline" className="border-green-500 text-green-600">✓</Badge>
                      ) : (
                        <Badge variant="outline" className="border-muted-foreground text-muted-foreground">—</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {w.is_active ? (
                        <Badge variant="outline" className="border-green-500 text-green-600">Faol</Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-500 text-red-600">Faol emas</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {hasPermission('qr.generate') && w.is_active && (
                          <Button size="icon" variant="ghost" title="QR yaratish/ko'rish"
                                  onClick={() => setQrFor(w)}>
                            <QrCode className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission('workers.update') && (
                          <Button size="icon" variant="ghost" title="Tahrirlash"
                                  onClick={() => setEditing(w)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission('workers.delete') && (
                          <Button size="icon" variant="ghost" title="O'chirish"
                                  onClick={() => {
                                    if (confirm(`${w.full_name} ishchini o'chirilsinmi?`)) {
                                      deleteMut.mutate(w.id);
                                    }
                                  }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showAdd && (
        <WorkerFormDialog
          mode="create"
          stages={stages || []}
          onClose={() => setShowAdd(false)}
          onSaved={() => qc.invalidateQueries({ queryKey: ['workers'] })}
        />
      )}
      {editing && (
        <WorkerFormDialog
          mode="edit"
          worker={editing}
          stages={stages || []}
          onClose={() => setEditing(null)}
          onSaved={() => qc.invalidateQueries({ queryKey: ['workers'] })}
        />
      )}
      {qrFor && (
        <QrDialog
          worker={qrFor}
          onClose={() => { setQrFor(null); qc.invalidateQueries({ queryKey: ['workers'] }); }}
        />
      )}
    </div>
  );
}

// ── Create / Edit dialog ────────────────────────────────────────────────────
function WorkerFormDialog({
  mode, worker, stages, onClose, onSaved,
}: {
  mode: 'create' | 'edit';
  worker?: Worker;
  stages: Stage[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    employee_code: worker?.employee_code || '',
    full_name:     worker?.full_name || '',
    phone:         worker?.phone || '',
    position:      worker?.position || '',
    default_stage: worker?.default_stage || 'none',
    is_active:     worker?.is_active ?? true,
  });

  const mut = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        default_stage: form.default_stage === 'none' ? null : form.default_stage,
        phone: form.phone || null,
        position: form.position || null,
      };
      if (mode === 'create') return api.post('/api/workers', payload);
      return api.put(`/api/workers/${worker!.id}`, payload);
    },
    onSuccess: () => {
      toast.success(mode === 'create' ? "Ishchi qo'shildi" : "Ishchi yangilandi");
      onSaved();
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? "Yangi ishchi qo'shish" : "Ishchini tahrirlash"}
          </DialogTitle>
          <DialogDescription>Ma'lumotlarni to'ldiring</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Tabel raqami *</Label>
            <Input
              value={form.employee_code}
              onChange={(e) => setForm({ ...form, employee_code: e.target.value.toUpperCase() })}
              placeholder="W001"
              disabled={mode === 'edit'}
              className="font-mono"
            />
          </div>
          <div>
            <Label>F.I.O. *</Label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Aziza Karimova"
            />
          </div>
          <div>
            <Label>Telefon</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+998 90 ..."
            />
          </div>
          <div>
            <Label>Lavozim</Label>
            <Input
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              placeholder="Tikuvchi / Kesuvchi / ..."
            />
          </div>
          <div>
            <Label>Doimiy bosqich</Label>
            <Select value={form.default_stage}
                    onValueChange={(v) => setForm({ ...form, default_stage: v })}>
              <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— yo'q —</SelectItem>
                {stages.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name_uz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Bu bosqichdan boshqa joyda scan qilsa, shubhali deb belgilanadi.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Bekor</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── QR dialog — show existing or generate new, with PNG image ──────────────
function QrDialog({ worker, onClose }: { worker: Worker; onClose: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery<{
    token: string;
    worker_name: string;
    employee_code: string;
    expires_at: string;
    qr_png_data_url: string;
  }>({
    queryKey: ['qr-active', worker.id],
    queryFn: () => api.get(`/api/qr/worker/${worker.id}/active`),
    retry: false,
  });

  const generateMut = useMutation({
    mutationFn: () => api.post(`/api/qr/generate/${worker.id}`),
    onSuccess: () => {
      toast.success("Yangi QR yaratildi");
      qc.invalidateQueries({ queryKey: ['qr-active', worker.id] });
      qc.invalidateQueries({ queryKey: ['workers'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const hasNoToken = error && (error as any).status === 404;

  const handlePrint = () => {
    if (!data) return;
    const w = window.open('', '_blank', 'width=600,height=800');
    if (!w) return;
    w.document.write(`
      <html>
        <head><title>QR — ${data.employee_code}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; }
            .badge { display: inline-block; padding: 24px; border: 2px solid #000; border-radius: 12px; }
            h1 { margin: 0 0 8px; font-size: 22px; }
            .code { font-family: monospace; font-size: 18px; color: #555; margin-bottom: 16px; }
            img { width: 280px; height: 280px; }
          </style>
        </head>
        <body>
          <div class="badge">
            <h1>${data.worker_name}</h1>
            <div class="code">${data.employee_code}</div>
            <img src="${data.qr_png_data_url}" alt="QR" />
            <p style="font-size: 11px; color: #888; margin-top: 16px;">
              Amal qilish muddati: ${new Date(data.expires_at).toLocaleDateString('uz-UZ')}
            </p>
          </div>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>QR Badge — {worker.full_name}</DialogTitle>
          <DialogDescription>
            <span className="font-mono">{worker.employee_code}</span>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : hasNoToken ? (
          <div className="text-center py-8 space-y-4">
            <QrCode className="h-16 w-16 mx-auto text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Bu ishchi uchun hali QR yaratilmagan
            </p>
            <Button onClick={() => generateMut.mutate()} disabled={generateMut.isPending}>
              {generateMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <QrCode className="mr-2 h-4 w-4" /> QR yaratish
            </Button>
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border-2 border-dashed flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.qr_png_data_url} alt="QR" className="w-64 h-64" />
            </div>
            <div className="text-xs text-muted-foreground text-center">
              Amal qilish: {new Date(data.expires_at).toLocaleDateString('uz-UZ')}
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase">Token (qo'lda nusxa olish uchun)</Label>
              <code className="block text-xs break-all bg-muted p-2 rounded">{data.token}</code>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={() => {
                navigator.clipboard.writeText(data.token);
                toast.success("Nusxalandi");
              }}>
                <Copy className="mr-2 h-4 w-4" /> Nusxa
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Chop
              </Button>
              <Button variant="outline" onClick={() => generateMut.mutate()}
                      disabled={generateMut.isPending}>
                {generateMut.isPending
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <RefreshCw className="mr-2 h-4 w-4" />}
                Yangi
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              "Yangi" tugmasi mavjud QR'ni bekor qiladi va yangisini yaratadi.
            </p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
